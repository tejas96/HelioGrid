import type { FileDownload, ProposalVersion, ProposalVersionSummary } from '@heliogrid/contracts';
import {
  type PrintedDocument,
  type ProposalDocumentPage,
  type ProposalDocumentStepInput,
  type ProposalDocumentStepResult,
  proposalDocumentWorkflow,
} from '@heliogrid/contracts/workflows';
import { proposalNumberOf, versionDiff } from '@heliogrid/domain/server';
import { proposalDocumentFailedNotice } from '@heliogrid/i18n';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { TemporalGateway } from '../../common/temporal/temporal.gateway';
import { ENV } from '../../config/env';
import type { LeadReader } from '../crm/crm.public';
import { FileDocumentService } from '../file/file.public';
import { renderedInEveryLanguage } from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { diffWire, documentWire } from './internal/document-wire';
import { mintPrintGrant } from './internal/print-grant';
import { ProposalsAssembler } from './proposals.assembler.service';
import { ProposalsReadRepository, type VersionFacts } from './proposals.read.repository';
import { ProposalsVersionsRepository } from './proposals.versions.repository';

const PDF = 'application/pdf';

/** The one record a version's PDF belongs to. */
const pdfOfVersion = (tenantId: string, versionId: string) =>
  ({ tenantId, subjectKind: 'proposal_version', subjectRef: versionId }) as const;

/**
 * A proposal's versions (`M06-42`, `M06-43`): each frozen whole at Generate and read back exactly
 * so — its document from its own snapshot, never assembled again — with what moved since the one
 * before; and its PDF, printed once from the web's own print page and then kept (`F5-38`).
 */
@Injectable()
export class ProposalsVersionsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProposalsReadRepository) private readonly reads: ProposalsReadRepository,
    @Inject(ProposalsVersionsRepository) private readonly versionRows: ProposalsVersionsRepository,
    @Inject(ProposalsAssembler) private readonly assembler: ProposalsAssembler,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
    @Inject(TemporalGateway) private readonly temporal: TemporalGateway,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  async versions(reader: LeadReader, proposalId: string): Promise<ProposalVersionSummary[]> {
    const pack = await this.settings.packOf(reader.tenantId);
    const facts = await this.reads.facts(reader, proposalId, pack.formats);
    if (facts === null) throw new NotFoundException('No such proposal.');
    return (await this.assembler.detail(reader, facts)).versions;
  }

  async version(reader: LeadReader, proposalId: string, version: number): Promise<ProposalVersion> {
    const pack = await this.settings.packOf(reader.tenantId);
    const facts = await this.facts(reader, proposalId, version);
    const { frozen, before, proposal } = facts;
    const summary = (await this.assembler.detail(reader, facts)).versions.find(
      (one) => one.version === version,
    );
    if (summary === undefined) throw new NotFoundException('No such version.');
    // A version never hands out our cost or a margin, whoever reads it (`M06-09`).
    const wire = { minorUnitDigits: pack.formats.minorUnitDigits, seesCost: false };
    return {
      ...summary,
      proposalId,
      document: documentWire(
        frozen.snapshot,
        {
          number: proposal.number === null ? null : proposalNumberOf(proposal.number),
          version,
          date: new Date(summary.generatedAt),
          ...(await this.assembler.pictures(reader.tenantId, frozen.snapshot)),
          preparedByUserId: summary.generatedBy?.userId ?? null,
        },
        wire,
      ),
      diff:
        before === null
          ? null
          : diffWire(versionDiff(before.snapshot, frozen.snapshot), wire.minorUnitDigits),
    };
  }

  /**
   * A version's PDF link, for a reader who may see its lead: the kept one, or one made now. A
   * render still going after the wait a person is given (`resultWhileAPersonWaits`) — or a renderer that cannot be reached — answers null,
   * and the next ask joins the same run (its id is the version's).
   */
  async pdf(
    reader: LeadReader,
    proposalId: string,
    version: number,
  ): Promise<{ download: FileDownload | null }> {
    const { frozen } = await this.facts(reader, proposalId, version);
    return { download: await this.pdfOf(reader.tenantId, frozen.id) };
  }

  /** The kept PDF of a version, or one made now — for the customer's link too, by the version's id. */
  async pdfOf(tenantId: string, versionId: string): Promise<FileDownload | null> {
    const kept =
      (await this.documents.kept(tenantId, 'proposal_version', versionId)) ??
      (await this.made({ tenantId, versionId }));
    return kept === null ? null : this.documents.signedDownload(tenantId, kept, Date.now());
  }

  /**
   * The page to print — the web's own print page, behind a short-lived grant — and the store's
   * signed address its PDF is PUT to; nothing when the PDF is kept.
   */
  async page({ tenantId, versionId }: ProposalDocumentStepInput): Promise<ProposalDocumentPage> {
    const kept = await this.documents.kept(tenantId, 'proposal_version', versionId);
    if (kept !== null) return { kind: 'kept', fileId: kept };
    if (!(await this.versionRows.exists(tenantId, versionId))) return null;
    const grant = mintPrintGrant(ENV.AUTH_TOKEN_SECRET, versionId, Date.now());
    return {
      kind: 'page',
      url: `${ENV.WEB_ORIGIN}/print/proposal/${versionId}?grant=${encodeURIComponent(grant)}`,
      origins: [ENV.WEB_ORIGIN, ENV.API_PUBLIC_ORIGIN],
      put: await this.documents.putAddress(pdfOfVersion(tenantId, versionId), PDF),
    };
  }

  /**
   * Keeps the PDF the renderer PUT against the version, once; a version gone since ends the step.
   * A store without what was printed fails the step for good: only a new print can cure it.
   */
  async keep(
    { tenantId, versionId, ...printed }: ProposalDocumentStepInput & PrintedDocument,
    now: number,
  ): Promise<ProposalDocumentStepResult> {
    if (!(await this.versionRows.exists(tenantId, versionId))) return { fileId: null };
    const fileId = await this.documents.keepPut({
      ...pdfOfVersion(tenantId, versionId),
      ...printed,
      contentType: PDF,
      now,
    });
    if (fileId === null) {
      throw stepCannotSucceed(`version ${versionId}'s PDF is not in the store as it was printed`);
    }
    return { fileId };
  }

  /** Tells the proposal's owner its version's PDF could not be made (`F5-39`). */
  async failed({ tenantId, versionId }: ProposalDocumentStepInput, now: number): Promise<void> {
    const served = await this.versionRows.byId(tenantId, versionId);
    if (served === null) return;
    this.logger.warn({ versionId }, 'proposal PDF failed both tries');
    await this.versionRows.tellPdfFailed(tenantId, versionId, {
      wordsIn: await renderedInEveryLanguage((translate) =>
        proposalDocumentFailedNotice(translate, {
          number: served.number,
          version: served.version,
        }),
      ),
      quietHours: await this.settings.quietHoursOf(tenantId),
      at: new Date(now),
    });
  }

  private async facts(
    reader: LeadReader,
    proposalId: string,
    version: number,
  ): Promise<VersionFacts> {
    const pack = await this.settings.packOf(reader.tenantId);
    const facts = await this.reads.version(reader, proposalId, version, pack.formats);
    if (facts === null) throw new NotFoundException('No such version.');
    return facts;
  }

  /** The PDF made by its workflow, waited for a while; null when it is not ready in time. */
  private async made(input: ProposalDocumentStepInput): Promise<string | null> {
    try {
      return (
        (await this.temporal.resultWhileAPersonWaits(proposalDocumentWorkflow, input))?.fileId ??
        null
      );
    } catch (error) {
      // The version stands and its page still reads: an unreachable renderer only delays the PDF.
      this.logger.warn({ err: error, versionId: input.versionId }, 'proposal PDF not made');
      return null;
    }
  }
}
