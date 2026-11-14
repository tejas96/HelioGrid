import type {
  FileDownload,
  InstallationFacts,
  linkHandoverSchema,
  linkProgressSchema,
} from '@heliogrid/contracts';
import {
  chainIndexOf,
  chainOf,
  clockTimeHhmm,
  clockTimeOfMinutes,
  localDate,
  type MarketPack,
  minorUnits,
  type ProjectChainStage,
  packLabel,
  stageLabel,
  typicalWaitDays,
  type UiLanguage,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, receiptNumberOf } from '@heliogrid/domain/server';
import { createTranslator, type Translator } from '@heliogrid/i18n';
import { Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { FileDocumentService } from '../file/file.public';
import { SettingsCollectionsService, SettingsService } from '../settings/settings.public';
import { duePartOf, moneyFormatOf, type StoodPart, stoodPartsOf } from './internal/money';
import { languageOfCustomer, payInstrumentOf } from './internal/payments-view';
import { receiptTextOf } from './internal/receipt-text';
import {
  type CustomerProjectFacts,
  type ProjectPhaseFacts,
  ProjectsCustomerRepository,
  phaseFactsOf,
} from './projects.customer.repository';

/** The progress page's facts, as the customer's link contract carries them. */
export type CustomerProgress = z.infer<typeof linkProgressSchema>;
/** The solar file's facts, as the customer's link contract carries them. */
export type CustomerSolarFile = z.infer<typeof linkHandoverSchema>;

/**
 * A won deal's project as its customer reads it on their link (`F5-57`…`F5-73`): the stages with
 * the market's own labels, the open wait as published, the installation day, the payment plan with
 * each receipt, and at the end the documents. Every figure and word is worked out here, on the
 * server; nothing here is gated by money (`F5-24`), and nothing the company did not publish leaves.
 */
@Injectable()
export class ProjectsCustomerService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsCustomerRepository) private readonly projects: ProjectsCustomerRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(SettingsCollectionsService) private readonly collections: SettingsCollectionsService,
    @Inject(FileDocumentService) private readonly documents: FileDocumentService,
  ) {}

  /** Where the deal stands, on the caller's transaction; `null` while it is not won. */
  phaseFactsOf(
    // The repository names the transaction's type: a service never imports the database.
    tx: Parameters<typeof phaseFactsOf>[0],
    tenantId: string,
    leadId: string,
  ): Promise<ProjectPhaseFacts | null> {
    return phaseFactsOf(tx, tenantId, leadId);
  }

  /**
   * The progress page (`F5-61`), in `language` — the page's own, else the customer's (`F5-08`).
   * `null` while the lead has no project.
   */
  async progressOf(
    tenantId: string,
    leadId: string,
    language?: UiLanguage,
  ): Promise<CustomerProgress | null> {
    const facts = await this.projects.facts(tenantId, leadId);
    if (facts === null) return null;
    const [pack, payTo, profile] = await Promise.all([
      this.settings.packOf(tenantId),
      this.collections.payTo(tenantId),
      this.settings.businessProfile(tenantId),
    ]);
    const spoken = language ?? languageOfCustomer(facts.preferredLanguage);
    const { t } = await createTranslator(spoken);
    const cancelled = facts.stage === 'cancelled';
    return {
      capacityKw: facts.system?.capacityKw ?? null,
      systemType: facts.system?.systemType ?? null,
      cancelledOn:
        facts.cancelledAt === null ? null : localDate(facts.cancelledAt.getTime(), facts.timeZone),
      stages: stagesOf(facts, pack, spoken),
      wait:
        facts.wait === null || cancelled
          ? null
          : {
              party: facts.wait.party,
              reason: facts.wait.reason,
              since: facts.wait.startedOn,
              typicalDays: typicalWaitDays(pack.formats.utilities, facts.wait.reason),
            },
      installation: installationOf(facts),
      payments: paymentsOf(facts, pack, payTo, {
        t,
        language: spoken,
        company: profile.companyName ?? payTo.payee,
      }),
    };
  }

  /** The solar file (`F5-70`…`F5-72`); `null` while the lead has no project. */
  async solarFileOf(tenantId: string, leadId: string): Promise<CustomerSolarFile | null> {
    const facts = await this.projects.facts(tenantId, leadId);
    if (facts === null) return null;
    const documents = await this.projects.documents(tenantId, facts.projectId);
    const commissioned = [...facts.arrivals].reverse().find((move) => move.to === 'commissioned');
    return {
      switchedOnAt: commissioned?.enteredOn ?? null,
      referTo: facts.companyPhoneE164,
      documents: documents.map((one) => ({ fileId: one.fileId, row: one.row, name: one.name })),
    };
  }

  /**
   * A short-lived link to a file the customer's page lists — a receipt's PDF while the project
   * runs, a handover document once it is handed over — and `null` for any other file, whatever
   * its id (`T-F5-006`: the page serves only its own files).
   */
  async customerFile(
    tenantId: string,
    leadId: string,
    fileId: string,
    now: number = Date.now(),
  ): Promise<FileDownload | null> {
    const facts = await this.projects.facts(tenantId, leadId);
    if (facts === null) return null;
    const receipts = new Set(facts.receiptFiles.values());
    const listed =
      receipts.has(fileId) ||
      (facts.stage === 'handed_over' &&
        (await this.projects.documents(tenantId, facts.projectId)).some(
          (one) => one.fileId === fileId,
        ));
    return listed ? this.documents.signedDownload(tenantId, fileId, now) : null;
  }
}

/** The market's word for a stage in the reader's language, else its key (`F1-09`). */
function stageWord(pack: MarketPack, stage: string, language: UiLanguage): string {
  const label = stageLabel(pack.formats.vocabulary, stage);
  return label === null ? stage : packLabel(label, language);
}

/**
 * The deal's own chain (`F5-62`): a stage it does not walk is absent, never an empty row. Behind
 * the stage reached every stage is done; the stage reached is current, or waiting while a wait is
 * open on it; the rest are ahead. A cancelled project shows how far it got and nothing as current.
 */
function stagesOf(
  facts: CustomerProjectFacts,
  pack: MarketPack,
  language: UiLanguage,
): CustomerProgress['stages'] {
  const cancelled = facts.stage === 'cancelled';
  const cancelledFrom = facts.arrivals.find((move) => move.to === 'cancelled')?.from ?? 'won';
  const reached = chainIndexOf(cancelled ? cancelledFrom : facts.stage);
  const closed = cancelled || facts.stage === 'handed_over';
  const arrivalOn = (stage: ProjectChainStage) =>
    [...facts.arrivals].reverse().find((move) => move.to === stage)?.enteredOn ?? null;
  return chainOf({ stage: facts.stage, incentiveApplies: facts.incentiveApplies }).map((stage) => {
    const index = chainIndexOf(stage);
    const state =
      index > reached
        ? 'ahead'
        : index < reached || closed
          ? 'done'
          : facts.wait === null
            ? 'current'
            : 'waiting';
    return {
      stage,
      label: stageWord(pack, stage, language),
      state,
      on: index <= reached ? arrivalOn(stage) : null,
    };
  });
}

/** The installation day's four facts (`F5-68`): each `null` until the manager schedules it. */
export function installationOf(
  facts: Pick<
    CustomerProjectFacts,
    | 'expectedInstallOn'
    | 'installStartMinutes'
    | 'installDurationDays'
    | 'installDisturbance'
    | 'crewLead'
  >,
): InstallationFacts {
  return {
    on: facts.expectedInstallOn,
    startTime:
      facts.installStartMinutes === null
        ? null
        : clockTimeHhmm(clockTimeOfMinutes(facts.installStartMinutes)),
    durationDays: facts.installDurationDays,
    disturbance: facts.installDisturbance,
    crewLead: facts.crewLead,
  };
}

/**
 * The payment plan as the customer reads it (`F5-57`…`F5-59`): each part with what came in and
 * its receipts — recorded by the company, never confirmed by a bank — and how to pay the part now
 * due, for exactly what it owes. An overdue part changes nothing else on the page (`F5-24`). A
 * cancelled project shows what was paid and asks for nothing.
 */
function paymentsOf(
  facts: CustomerProjectFacts,
  pack: MarketPack,
  payTo: Awaited<ReturnType<SettingsCollectionsService['payTo']>>,
  words: { readonly t: Translator['t']; readonly language: UiLanguage; readonly company: string },
): CustomerProgress['payments'] {
  const format = moneyFormatOf(pack.formats, facts.timeZone);
  const decimal = (amount: number) => minorUnitsToDecimal(minorUnits(amount), format.digits);
  const cancelled = facts.stage === 'cancelled';
  const reversedOn = new Map(
    facts.entries.flatMap((entry) =>
      entry.reversesId === null
        ? []
        : [[entry.reversesId, localDate(entry.recordedAt.getTime(), facts.timeZone)] as const],
    ),
  );
  const receiptsOf = (part: StoodPart) =>
    facts.entries
      .filter(
        (entry) =>
          entry.partId === part.facts.id &&
          entry.kind === 'payment' &&
          entry.receiptNumber !== null,
      )
      .map((entry) => ({
        number: receiptNumberOf(entry.receiptNumber ?? 0),
        amount: decimal(entry.amountMinor),
        receivedOn: entry.receivedOn,
        reversedOn: reversedOn.get(entry.id) ?? null,
        text: receiptTextOf(words.t, pack, words.language, {
          receiptNumber: entry.receiptNumber ?? 0,
          company: words.company,
          customer: facts.customerName ?? facts.phoneE164,
          projectNumber: facts.number,
          part: part.facts.label,
          amountMinor: entry.amountMinor,
          mode: entry.mode,
          receivedOn: entry.receivedOn,
          reference: entry.reference,
          recorder: entry.recordedBy.name,
        }),
        fileId: facts.receiptFiles.get(entry.id) ?? null,
      }));
  const stood = stoodPartsOf(facts.parts);
  const shown = cancelled ? stood.filter((part) => part.facts.receivedMinor > 0) : stood;
  const due = cancelled ? null : duePartOf(stood);
  const instrument =
    due === null
      ? null
      : payInstrumentOf(due, { projectNumber: facts.number, pack, payTo }, format);
  return {
    currencyCode: format.currency,
    parts: shown.map((part) => ({
      label: part.facts.label,
      amount: decimal(part.facts.amountMinor),
      state: part.standing.state,
      received: decimal(part.facts.receivedMinor),
      outstanding: decimal(part.standing.outstanding),
      receipts: receiptsOf(part),
    })),
    due:
      due === null || instrument === null
        ? null
        : {
            label: due.facts.label,
            amount: instrument.amount,
            upiUri: instrument.upiUri,
            note: instrument.note,
            payTo,
          },
  };
}
