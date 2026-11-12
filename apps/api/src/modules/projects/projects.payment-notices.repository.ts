import type { DbTransaction } from '@heliogrid/db';
import { minorUnits, type NotificationType, type UiLanguage } from '@heliogrid/domain';
import { minorUnitsToDecimal } from '@heliogrid/domain/server';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { type MoneyFormat, stoodPartsOf } from './internal/money';
import { partFactsOf } from './projects.money.repository';
import { projectReadableBy } from './projects.scope.repository';

/*
 * The money notices (`F6` payments rows), written inside the change that earned them (`F6-06`):
 * a part fell due — its manager and the people who record money hear it, with a one-tap ask
 * (ruling 2026-11-10); money came in — the manager hears who recorded it; a payment was taken
 * back — the people who answer for the money hear it.
 */

/** The words each notice needs, rendered once per language by the service before the write. */
export interface PaymentNoticeWords {
  readonly due: (
    name: string,
    part: string,
    amount: string,
  ) => Promise<(language: UiLanguage) => NoticeWords>;
  readonly amountOf: (decimal: string) => string;
  readonly format: MoneyFormat;
  readonly quietHours: TenantQuietHours;
}

/** The project a notice is about, as the lock read it. */
export interface NoticeProject {
  readonly tenantId: string;
  readonly projectId: string;
  readonly managerId: string;
  readonly name: string;
}

/**
 * Tells of each part that fell due at `since` — the move just written — and still owes money.
 * Returns the notices written, for their push after the commit.
 */
export async function noticePartsNowDue(
  tx: DbTransaction,
  about: NoticeProject,
  since: Date,
  words: PaymentNoticeWords,
): Promise<string[]> {
  const facts = (await partFactsOf(tx, about.tenantId, [about.projectId])).get(about.projectId);
  const nowDue = stoodPartsOf(facts ?? []).filter(
    (part) => part.facts.dueSince === since.getTime() && part.standing.outstanding > 0,
  );
  const written: string[] = [];
  for (const part of nowDue) {
    const amount = words.amountOf(
      minorUnitsToDecimal(minorUnits(part.standing.outstanding), words.format.digits),
    );
    written.push(
      ...(await notify(
        tx,
        about,
        'payment_due',
        since,
        await words.due(about.name, part.facts.label, amount),
        words.quietHours,
        null,
      )),
    );
  }
  return written;
}

/** Writes one money notice to the people its type names, less the person who caused it. */
export async function notify(
  tx: DbTransaction,
  about: NoticeProject,
  type: Extract<NotificationType, 'payment_due' | 'payment_recorded' | 'payment_reversed'>,
  at: Date,
  wordsIn: (language: UiLanguage) => NoticeWords,
  quietHours: TenantQuietHours,
  causedBy: string | null,
): Promise<string[]> {
  const recipients = await recipientsFor(
    tx,
    about.tenantId,
    type,
    { ownerUserId: about.managerId, assigneeUserId: null, awaits: 'payments.record_payments' },
    projectReadableBy(tx, about.tenantId, about.projectId),
  );
  return recordNotificationsTo(
    tx,
    recipients.filter((recipient) => recipient.userId !== causedBy),
    {
      tenantId: about.tenantId,
      type,
      // The notice opens the project, where the money is.
      subjectKind: 'project',
      subjectRef: about.projectId,
      emittedAt: at,
    },
    wordsIn,
    quietHours,
  );
}
