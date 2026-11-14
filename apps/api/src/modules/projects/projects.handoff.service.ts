import type { ComposedMessage, VersionInForcePreview, WonBasisWire } from '@heliogrid/contracts';
import {
  basisPointsToPercent,
  composeMessage,
  type FormatPack,
  formatDate,
  formatPhone,
  formatTime,
  isTrancheDueStage,
  type MinorUnits,
  minorUnits,
  type SchedulePart,
  type ScheduleTerm,
} from '@heliogrid/domain';
import { chatRequestUri, minorUnitsToDecimal, proportionOf } from '@heliogrid/domain/server';
import { createTranslator, installDurationWords, proposalMessageTemplate } from '@heliogrid/i18n';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LeadReader } from '../crm/crm.public';
import { SettingsService } from '../settings/settings.public';
import { languageOfCustomer } from './internal/payments-view';
import type { ProjectReader } from './internal/reader';
import { ProjectsDetailReadRepository } from './projects.detail-read.repository';
import { ProjectsInForceRepository } from './projects.in-force.repository';
import { ProjectsWonBasisRepository, planOfVersion } from './projects.won-basis.repository';

/** A whole, in basis points: 100 %. */
const WHOLE_BASIS_POINTS = 10_000;
const WHOLE_SHARE = minorUnits(WHOLE_BASIS_POINTS);

/**
 * Each new part's share of what is left, as the sheet says it ("60% of what is left"), rounded
 * once by domain's `proportionOf`. The last part takes the rest, so it has none — nor does a lone part.
 */
function sharesOfRestOf(parts: readonly SchedulePart[]): readonly (string | null)[] {
  const ofParts = parts.reduce((sum, part) => sum + part.share, 0);
  return parts.map((part, index) =>
    index === parts.length - 1 || ofParts === 0
      ? null
      : basisPointsToPercent(proportionOf(WHOLE_SHARE, { parts: part.share, ofParts })),
  );
}

/**
 * Where a proposal meets its project (`M07-62`, `M08-50`, `M11-14`, `F5-68`): what Mark won takes
 * from the accepted version, what putting a newer version in force would do, and the evening-before
 * installation message a person sends. Each is read from the deal itself; nothing here is typed by
 * a device (`F4-04`).
 */
@Injectable()
export class ProjectsHandoffService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsWonBasisRepository) private readonly basis: ProjectsWonBasisRepository,
    @Inject(ProjectsInForceRepository) private readonly inForce: ProjectsInForceRepository,
    @Inject(ProjectsDetailReadRepository) private readonly detail_: ProjectsDetailReadRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  /** What *Mark won* opens on for a lead the reader may see. */
  async wonBasis(reader: LeadReader, leadId: string): Promise<WonBasisWire> {
    const [facts, pack] = await Promise.all([
      this.basis.wonBasis(reader, leadId),
      this.settings.packOf(reader.tenantId),
    ]);
    if (facts === null) throw new NotFoundException('No such lead.');
    const { basis, accepted, acceptance } = facts;
    const decimal = decimalOf(pack.formats);
    const stands = basis.kind === 'accepted_version' && accepted !== null;
    const termOf = (term: ScheduleTerm, amount: MinorUnits | null) => ({
      label: term.label,
      percent: basisPointsToPercent(term.share),
      dueOnStage: term.dueOnStage,
      amount: amount === null ? null : decimal(amount),
    });
    return {
      basis: basis.kind,
      currencyCode: pack.formats.currency,
      proposal: accepted === null ? null : { id: accepted.proposalId, number: accepted.number },
      acceptance:
        accepted === null || acceptance === null
          ? null
          : {
              version: accepted.version,
              acceptedAt: acceptance.acceptedAt.toISOString(),
              linkLabel: acceptance.linkLabel,
              contactName: acceptance.contactName,
            },
      unansweredVersion: basis.kind === 'newer_version_unanswered' ? basis.sharedVersion : null,
      finalValue: stands ? decimal(accepted.payableMinor) : null,
      plan: stands
        ? planOfVersion(accepted.snapshot).map((part) => termOf(part, part.amount))
        : facts.defaultTerms.map((term) => termOf(term, null)),
      siblingProposal: facts.sibling,
    };
  }

  /** *Put version N in force* as its sheet shows it before the person confirms. */
  async preview(
    reader: ProjectReader,
    projectId: string,
    version: number,
  ): Promise<VersionInForcePreview> {
    const [found, pack] = await Promise.all([
      this.inForce.preview(reader, projectId, version),
      this.settings.packOf(reader.tenantId),
    ]);
    if (found === null) throw new NotFoundException('No such project or version.');
    if (found.kind === 'forbidden') throw notTheirs();
    const decimal = decimalOf(pack.formats);
    const { plan } = found;
    const sharesOfRest = sharesOfRestOf(plan.made.parts);
    return {
      version,
      currencyCode: pack.formats.currency,
      newTotal: decimal(found.facts.asked?.payable ?? 0),
      paid: decimal(plan.collected),
      remaining: decimal(plan.made.remaining),
      surplus: plan.made.surplus === null ? null : decimal(plan.made.surplus),
      plan: [
        ...plan.kept.map((part) => ({
          label: part.label,
          amount: decimal(part.amount),
          state: part.state,
          dueOnStage: isTrancheDueStage(part.dueOnStage) ? part.dueOnStage : null,
          shareOfRest: null,
          paidOn: part.paidOn,
        })),
        ...plan.made.parts.map((part, index) => ({
          label: part.label,
          amount: decimal(part.amount),
          state: 'new' as const,
          dueOnStage: part.dueOnStage,
          shareOfRest: sharesOfRest[index] ?? null,
          paidOn: null,
        })),
      ],
    };
  }

  /**
   * The evening-before installation message (`F5-68`), composed from `crew_arrival` in the
   * customer's language for a person to send: who is coming, when, for how long, what to expect,
   * and the crew lead's name and number. A fact not yet scheduled is left out, never a placeholder.
   */
  async crewMessage(reader: ProjectReader, projectId: string): Promise<ComposedMessage> {
    const pack = await this.settings.packOf(reader.tenantId);
    const { formats } = pack;
    const detail = await this.detail_.detail(reader, projectId, formats);
    if (detail === null) throw new NotFoundException('No such project.');
    const language = languageOfCustomer(detail.customer.preferredLanguage);
    const [{ t }, company] = await Promise.all([
      createTranslator(language),
      this.detail_.companyNameOf(reader.tenantId),
    ]);
    const day = detail.installation;
    const { text } = composeMessage(proposalMessageTemplate(t, 'crew_arrival'), {
      customer: detail.customer.name ?? undefined,
      company,
      date: day?.on == null ? undefined : formatDate(formats, day.on, language),
      time: day?.startTime == null ? undefined : formatTime(formats, day.startTime),
      crew: detail.crew.length === 0 ? undefined : detail.crew.map((one) => one.name).join(', '),
      duration: day?.durationDays == null ? undefined : installDurationWords(t, day.durationDays),
      disturbance: day?.disturbance ?? undefined,
      crewLead: day?.crewLead?.name,
      crewLeadPhone:
        day?.crewLead == null ? undefined : formatPhone(formats, day.crewLead.phoneE164),
    });
    return {
      language,
      text,
      link: null,
      chatUri: chatRequestUri(
        pack.paymentRails.requestChat ?? null,
        detail.customer.phoneE164,
        text,
      ),
    };
  }
}

const decimalOf = (formats: FormatPack) => (amount: number) =>
  minorUnitsToDecimal(minorUnits(amount), formats.minorUnitDigits);

const notTheirs = () =>
  new ForbiddenException('Only the lead’s owner or the project’s manager may confirm this.');
