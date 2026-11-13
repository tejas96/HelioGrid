import {
  type MoneyDue,
  PAYMENT_ACT_REFUSED,
  type ProjectPayments,
  paymentsContract,
  type RecordedPayment,
  type RecordPayment,
  type ReferenceCheck,
} from '@heliogrid/contracts';
import {
  availablePaymentModes,
  can,
  localDate,
  type MoneyDueGroup,
  monthOf,
} from '@heliogrid/domain';
import { createTranslator, paymentRecordedNotice, paymentReversedNotice } from '@heliogrid/i18n';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { ContractException, refusalWithFacts } from '../../common/errors/contract-exception';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsCollectionsService, SettingsService } from '../settings/settings.public';
import { moneyDueOf } from './internal/money-due';
import { languageOfCustomer, paymentsViewOf } from './internal/payments-view';
import type { ProjectReader } from './internal/reader';
import type { PaymentActContext, PaymentActOutcome } from './projects.payment-checks.repository';
import { ProjectsPaymentWordsService } from './projects.payment-words.service';
import { ProjectsPaymentsRepository } from './projects.payments.repository';
import { ProjectsPaymentsReadRepository } from './projects.payments-read.repository';

/**
 * A project's money (`M11`): the payments screen, Money due, the reference check and the four
 * acts. The customer pays
 * the company straight and a person records it (owner ruling 2026-11-11). Every figure is worked
 * out here, on the server (`F4-04`).
 */
@Injectable()
export class ProjectsPaymentsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ProjectsPaymentsReadRepository) private readonly reads: ProjectsPaymentsReadRepository,
    @Inject(ProjectsPaymentsRepository) private readonly writes: ProjectsPaymentsRepository,
    @Inject(ProjectsPaymentWordsService) private readonly words: ProjectsPaymentWordsService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(SettingsCollectionsService) private readonly collections: SettingsCollectionsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
  ) {}

  async payments(reader: ProjectReader, projectId: string, now: number): Promise<ProjectPayments> {
    const [facts, pack, payTo, company] = await Promise.all([
      this.reads.payments(reader, projectId),
      this.settings.packOf(reader.tenantId),
      this.collections.payTo(reader.tenantId),
      this.settings.businessProfile(reader.tenantId),
    ]);
    if (facts === null) throw new NotFoundException('No such project.');
    const language = languageOfCustomer(facts.head.preferredLanguage);
    const { t } = await createTranslator(language);
    return paymentsViewOf({
      facts,
      pack,
      payTo,
      company: company.companyName ?? payTo.payee,
      t,
      language,
      today: localDate(now, facts.head.timeZone),
      acts: {
        record: can(reader.roles, 'payments.record_payments'),
        waive: can(reader.roles, 'payments.waive_tranche'),
        share: can(reader.roles, 'payments.send_request_message'),
      },
    });
  }

  async moneyDue(
    reader: ProjectReader,
    page: { readonly page: number; readonly limit: number; readonly group?: MoneyDueGroup },
    now: number,
  ): Promise<MoneyDue> {
    const pack = await this.settings.packOf(reader.tenantId);
    const { timezone } = await this.settings.quietHoursOf(reader.tenantId);
    const today = localDate(now, timezone);
    const owing = await this.reads.owing(reader, monthOf(today));
    const canRemind = can(reader.roles, 'payments.send_request_message');
    return moneyDueOf(owing, pack, timezone, today, page, canRemind);
  }

  /** Whether a typed reference is already on a receipt that stands (`M11-38`). */
  async referenceCheck(reader: ProjectReader, reference: string): Promise<ReferenceCheck> {
    return { receiptNumber: await this.reads.receiptWithReference(reader.tenantId, reference) };
  }

  async record(
    reader: ProjectReader,
    projectId: string,
    body: RecordPayment,
    actor: { readonly act: Act; readonly name: string; readonly key: CreationKey | null },
  ): Promise<RecordedPayment> {
    const context = await this.contextOf(reader, actor);
    const pack = await this.settings.packOf(reader.tenantId);
    const modes = availablePaymentModes(pack.paymentRails, false).map((mode) => mode.mode);
    const name = actor.name;
    const outcome = await this.writes.record(
      context,
      projectId,
      body,
      modes,
      actor.key,
      (project, amount, part) =>
        renderedInEveryLanguage((t) =>
          paymentRecordedNotice(t, { name: project, part, amount, recorder: name }),
        ),
    );
    const payments = await this.answered(reader, projectId, outcome, actor.act);
    const recordedId = 'recorded' in outcome ? outcome.recorded : undefined;
    if (recordedId === undefined) throw new Error('a recording answered without its payment');
    return { ...payments, recordedId };
  }

  async reverse(
    reader: ProjectReader,
    projectId: string,
    entryId: string,
    reason: string,
    actor: { readonly act: Act; readonly name: string },
  ): Promise<ProjectPayments> {
    const context = await this.contextOf(reader, { ...actor, key: null });
    const outcome = await this.writes.reverse(
      context,
      projectId,
      entryId,
      reason,
      (project, amount) =>
        renderedInEveryLanguage((t) =>
          paymentReversedNotice(t, { name: project, amount, recorder: actor.name, reason }),
        ),
    );
    return this.answered(reader, projectId, outcome, actor.act);
  }

  async waive(
    reader: ProjectReader,
    projectId: string,
    partId: string,
    reason: string,
    actor: { readonly act: Act; readonly name: string },
  ): Promise<ProjectPayments> {
    const context = await this.contextOf(reader, { ...actor, key: null });
    const outcome = await this.writes.waive(context, projectId, partId, reason);
    return this.answered(reader, projectId, outcome, actor.act);
  }

  async shared(
    reader: ProjectReader,
    projectId: string,
    partId: string,
    actor: { readonly act: Act; readonly name: string },
  ): Promise<ProjectPayments> {
    const context = await this.contextOf(reader, { ...actor, key: null });
    const outcome = await this.writes.shared(context, projectId, partId);
    return this.answered(reader, projectId, outcome, actor.act);
  }

  private async contextOf(
    reader: ProjectReader,
    actor: { readonly act: Act; readonly name: string; readonly key?: CreationKey | null },
  ): Promise<PaymentActContext> {
    const [words, pack] = await Promise.all([
      this.words.wordsOf(reader.tenantId),
      this.settings.packOf(reader.tenantId),
    ]);
    return {
      reader,
      actorName: actor.name,
      act: actor.act,
      words,
      digits: pack.formats.minorUnitDigits,
    };
  }

  /** The act's answer: the payments screen as it now stands, or the refusal the route declares. */
  private async answered(
    reader: ProjectReader,
    projectId: string,
    outcome: PaymentActOutcome,
    act: Act,
  ): Promise<ProjectPayments> {
    if (outcome.outcome === 'not-found') throw new NotFoundException('No such project or part.');
    if (outcome.outcome === 'key-reused') {
      throw new ContractException(
        'IDEMPOTENCY_KEY_REUSED',
        'This retry key already made a record for a different request.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (outcome.outcome === 'refused') {
      throw refusalWithFacts(
        paymentsContract.reverse.responses[422],
        HttpStatus.UNPROCESSABLE_ENTITY,
        {
          code: PAYMENT_ACT_REFUSED,
          message: 'That money act cannot be taken where the part stands.',
          facts: { refusal: outcome.refusal, receiptNumber: outcome.receiptNumber },
        },
      );
    }
    if (outcome.outcome === 'done') {
      await this.push.deliverAfterCommit(reader.tenantId, outcome.notified, new Date(act.now));
    }
    return this.payments(reader, projectId, act.now);
  }
}
