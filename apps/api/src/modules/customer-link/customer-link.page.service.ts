import type { CustomerPage, FileDownload, ProposalDocument } from '@heliogrid/contracts';
import {
  type LinkFailureReason,
  mayRespond,
  PROJECT_STAGE_CHAIN,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { FileDocumentService } from '../file/file.public';
import {
  ProposalsPrintService,
  ProposalsVersionsService,
  type ServedVersion,
} from '../proposals/proposals.public';
import { SettingsService } from '../settings/settings.public';
import { CustomerLinkPageRepository, type PageRead } from './customer-link.page.repository';
import { CustomerProjectsRegistry } from './customer-link.projects.repository';
import {
  LinkTokenAdminRepository,
  type PresentedToken,
} from './customer-link.token.admin.repository';
import type { LinkVisit } from './customer-link.visit.repository';
import { asksOpen } from './internal/page-rules';

/** What every page carries, whatever its phase; the language is one this build renders. */
type PageHead = Pick<CustomerPage, 'company' | 'person'> & { readonly language: UiLanguage };

/**
 * The customer's one page (`F5-19`): the proposal, then the progress, then the solar file, at one
 * address — or the honest page of a link that cannot serve (`F5-25`), which names the company and a
 * person and nothing of the customer. One read answers whichever the deal's state calls for; no
 * billing state and no money owed is ever read on the way (`F5-23`, `F5-24`).
 */
@Injectable()
export class CustomerLinkPageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(LinkTokenAdminRepository) private readonly tokens: LinkTokenAdminRepository,
    @Inject(CustomerLinkPageRepository) private readonly pages: CustomerLinkPageRepository,
    @Inject(CustomerProjectsRegistry) private readonly projects: CustomerProjectsRegistry,
    @Inject(ProposalsPrintService) private readonly prints: ProposalsPrintService,
    @Inject(ProposalsVersionsService) private readonly versions: ProposalsVersionsService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
  ) {}

  /** The token as the store knows it, or `null` for one the product never minted — a plain 404. */
  presented(token: string): Promise<PresentedToken | null> {
    return this.tokens.presented(token);
  }

  /** The page for a token; `null` where no such link exists. */
  async page(token: string, now: number): Promise<CustomerPage | null> {
    const presented = await this.tokens.presented(token);
    return presented === null ? null : this.pageOf(presented, now);
  }

  async pageOf(presented: PresentedToken, now: number): Promise<CustomerPage | null> {
    const read = await this.pages.read(presented, now);
    if (read === null) return null;
    const { visit } = read;
    const head = await this.headOf(visit);
    if (visit.serving.kind === 'fails') return off(head, visit.serving.reason);
    const { tenantId, leadId } = visit;
    const shared = {
      ...head,
      questions: read.questions.map((question) => ({
        id: question.id,
        text: question.text,
        askedAt: question.askedAt.toISOString(),
        state: 'received' as const,
      })),
      mayAsk: asksOpen(visit),
    };
    switch (visit.serving.phase) {
      case 'proposal': {
        if (visit.served === null) return off(head, 'none');
        const document = await this.prints.documentOf(tenantId, visit.served);
        return {
          ...shared,
          kind: 'proposal',
          proposal: proposalOf(read, visit.served, document, visit.serving.rights),
        };
      }
      case 'progress': {
        const progress = await this.projects.progressOf(tenantId, leadId, head.language);
        return { ...shared, kind: 'progress', ...(progress === null ? {} : { progress }) };
      }
      case 'handover': {
        const handover = await this.projects.solarFileOf(tenantId, leadId);
        return { ...shared, kind: 'handover', ...(handover === null ? {} : { handover }) };
      }
    }
  }

  /** The PDF of the version the page shows; `undefined` where the link serves no proposal. */
  async pdf(token: string, now: number): Promise<{ download: FileDownload | null } | undefined> {
    const visit = await this.servingVisit(token, now);
    if (visit === null || visit.serving.kind !== 'serves') return undefined;
    if (visit.serving.phase !== 'proposal' || visit.served === null) return undefined;
    return { download: await this.versions.pdfOf(visit.tenantId, visit.served.versionId) };
  }

  /** A file the page lists, checked against the link's phase (`F5-21`): only a won deal's page lists any. */
  async file(token: string, fileId: string, now: number): Promise<FileDownload | null> {
    const visit = await this.servingVisit(token, now);
    if (visit === null || visit.serving.kind !== 'serves') return null;
    if (visit.serving.phase === 'proposal') return null;
    return this.projects.customerFile(visit.tenantId, visit.leadId, fileId);
  }

  private async servingVisit(token: string, now: number): Promise<LinkVisit | null> {
    const presented = await this.tokens.presented(token);
    if (presented === null) return null;
    return (await this.pages.read(presented, now))?.visit ?? null;
  }

  /** The company as the page dresses itself (`F5-81`), the reader's language and the person to call. */
  private async headOf(visit: LinkVisit): Promise<PageHead> {
    const { inForce } = await this.settings.forProposals(visit.tenantId);
    const identity = inForce.companyIdentity.value;
    const branding = inForce.branding.value;
    const logo =
      identity.logoFileId === null
        ? null
        : await this.documents.signedDownload(visit.tenantId, identity.logoFileId, Date.now());
    const language: UiLanguage = visit.preferredLanguage ?? inForce.locale.value.defaultLanguage;
    return {
      language,
      company: {
        name: identity.companyName,
        logoUrl: logo?.url ?? null,
        brandColour: branding.brandColour,
        shades: branding.shades,
      },
      person:
        visit.person === null
          ? null
          : { name: visit.person.name, phoneE164: visit.person.phoneE164 },
    };
  }
}

/** The honest page of a link that cannot serve (`F5-25`): why, the company, a person — nothing else. */
function off(head: PageHead, reason: LinkFailureReason): CustomerPage {
  return { ...head, kind: 'off', off: { reason }, mayAsk: false };
}

/** The proposal phase (`F5-32`): the served version, what was answered on it, and what may still be done. */
function proposalOf(
  read: PageRead,
  served: ServedVersion,
  document: ProposalDocument,
  rights: Parameters<typeof mayRespond>[0],
): NonNullable<CustomerPage['proposal']> {
  const { visit } = read;
  const [atSigning] = PROJECT_STAGE_CHAIN;
  const advance = document.money?.tranches?.find((part) => part.dueOnStage === atSigning);
  const answered = served.answer !== null && served.answeredAt !== null;
  return {
    document,
    versionId: served.versionId,
    mayRespond: !answered && mayRespond(rights, visit.respondsInWindow),
    answer:
      served.answer === null || served.answeredAt === null
        ? null
        : {
            kind: served.answer,
            at: served.answeredAt.toISOString(),
            words: read.answerWords,
          },
    advance: advance?.amount ?? null,
    callRequest:
      read.callRequest === null
        ? null
        : {
            requestedAt: read.callRequest.requestedAt.toISOString(),
            dueAt: read.callRequest.dueAt.toISOString(),
          },
  };
}
