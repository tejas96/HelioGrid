import {
  type Db,
  type DbTransaction,
  dunningEvent,
  subscription,
  tenant,
  userAccount,
} from '@heliogrid/db';
import {
  type BillingNotice,
  LIVE_BILLING_STATES,
  ladderBeginsAt,
  ladderOf,
  ladderStartOf,
  type NoticeClock,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, isNotNull, isNull, max, ne, type SQL, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import type { NoticeWords } from '../notification/notification.public';
import {
  activeOwnersOf,
  type NoticeToEach,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import type { NoticeCandidate } from './billing-notice-candidates.admin.repository';

/** What the sweep needs to decide, read under the row's lock. */
export interface NoticeStanding {
  readonly clock: NoticeClock;
  readonly lastToldDueAt: number | null;
  readonly signedUpAt: number;
}

/** What one look decided, worked out by the caller from the standing. */
export type NoticeVerdict =
  | {
      readonly kind: 'tell';
      readonly notice: BillingNotice;
      readonly dueAt: number;
      readonly whileProtected: boolean;
      readonly lookAgainAt: number | null;
    }
  | { readonly kind: 'look again'; readonly at: number | null };

/** A notice told: what the push and the text after the commit need. */
export interface ToldNotice {
  readonly eventId: string;
  readonly notice: BillingNotice;
  readonly whileProtected: boolean;
  readonly companyName: string;
  readonly notificationIds: readonly string[];
  readonly owners: readonly { readonly phoneE164: string; readonly language: UiLanguage }[];
}

/**
 * One look at a billing notice's ladder, and the clear a charge makes (`M12-09`, `M12-39`,
 * `M12-42`). They cross every company, so they ride the admin pool.
 */
@Injectable()
export class BillingNoticeAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /**
   * One look at one ladder, in one transaction under the subscription's lock — the lock a charge
   * takes too, so a payment and a notice never cross. `decide` is the domain's; `wordsOf` hands
   * each owner's words for the notice it chose. `null`: no notice was told.
   */
  async look(
    candidate: NoticeCandidate,
    now: number,
    decide: (standing: NoticeStanding) => NoticeVerdict,
    wordsOf: (
      notice: BillingNotice,
      whileProtected: boolean,
    ) => (language: UiLanguage) => NoticeWords,
    quietHours: TenantQuietHours,
  ): Promise<ToldNotice | null> {
    return this.db.transaction(async (tx) => {
      const standing = await standingOf(tx, candidate.subscriptionId);
      if (standing === null) return null;
      const verdict = decide(standing);
      if (verdict.kind === 'look again') {
        await lookAgain(tx, candidate, verdict.at);
        return null;
      }
      const [told] = await tx
        .insert(dunningEvent)
        .values({
          tenantId: candidate.tenantId,
          subscriptionId: candidate.subscriptionId,
          notice: verdict.notice,
          dueAt: new Date(verdict.dueAt),
          firedAt: new Date(now),
          forfeitureDisclosed: verdict.whileProtected,
          nextDueAt: null,
        })
        .onConflictDoNothing()
        .returning({ id: dunningEvent.id });
      if (told === undefined) return null;
      await lookAgain(tx, candidate, null);
      await tx
        .update(dunningEvent)
        .set({ nextDueAt: verdict.lookAgainAt === null ? null : new Date(verdict.lookAgainAt) })
        .where(and(eq(dunningEvent.tenantId, candidate.tenantId), eq(dunningEvent.id, told.id)));
      const owners = await activeOwnersOf(tx, candidate.tenantId);
      const notice: NoticeToEach = {
        tenantId: candidate.tenantId,
        type: ladderOf(verdict.notice) === 'trial' ? 'trial_nudge' : 'dunning_notice',
        subjectKind: 'dunning_event',
        subjectRef: told.id,
        emittedAt: new Date(now),
      };
      const notificationIds = await recordNotificationsTo(
        tx,
        owners,
        notice,
        wordsOf(verdict.notice, verdict.whileProtected),
        quietHours,
      );
      return {
        eventId: told.id,
        notice: verdict.notice,
        whileProtected: verdict.whileProtected,
        companyName: await companyNameOf(tx, candidate.tenantId),
        notificationIds,
        owners: await phonesOf(tx, owners),
      };
    });
  }
}

/**
 * `M12-09` — a charge that ends a company's unpaid spell clears every open notice of the company
 * it paid for, on the charge's own transaction, and ends their ladders: a reactivation pays on a
 * new row, and the old row's win-backs must stop with it.
 */
export async function clearOpenNotices(
  tx: DbTransaction,
  tenantId: string,
  paymentId: string,
  at: number,
): Promise<void> {
  await holdCompanyNotices(tx, tenantId);
  await tx
    .update(dunningEvent)
    .set({ clearedAt: new Date(at), clearedByPayment: paymentId, nextDueAt: null })
    .where(and(eq(dunningEvent.tenantId, tenantId), isNull(dunningEvent.clearedAt)));
}

/** The lock a company's notices are told and cleared under, keyed by the company. */
export function companyNoticesLock(tenantId: string): SQL {
  return sql`select pg_advisory_xact_lock(hashtext(${`billing-notices:${tenantId}`}))`;
}

/**
 * A notice told on one row and a payment on another of the same company — a reactivation — never
 * cross: both take this lock, always AFTER the subscription row they lock, so neither waits on the
 * other holding a row it needs.
 */
async function holdCompanyNotices(tx: DbTransaction, tenantId: string): Promise<void> {
  await tx.execute(companyNoticesLock(tenantId));
}

async function standingOf(
  tx: DbTransaction,
  subscriptionId: string,
): Promise<NoticeStanding | null> {
  const [row] = await tx
    .select({
      tenantId: subscription.tenantId,
      state: subscription.state,
      stateEnteredAt: subscription.stateEnteredAt,
      trialEndsAt: subscription.trialEndsAt,
      paidPeriodEnd: subscription.paidPeriodEnd,
      signedUpAt: tenant.createdAt,
    })
    .from(subscription)
    .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
    .where(eq(subscription.id, subscriptionId))
    .for('update', { of: subscription });
  if (row === undefined) return null;
  await holdCompanyNotices(tx, row.tenantId);
  const [newer] = await tx
    .select({ id: subscription.id })
    .from(subscription)
    .where(
      and(
        eq(subscription.tenantId, row.tenantId),
        ne(subscription.id, subscriptionId),
        inArray(subscription.state, [...LIVE_BILLING_STATES]),
      ),
    )
    .limit(1);
  const clock: NoticeClock = {
    state: row.state,
    stateEnteredAt: row.stateEnteredAt.getTime(),
    trialEndsAt: row.trialEndsAt?.getTime() ?? null,
    paidPeriodEnd: row.paidPeriodEnd?.getTime() ?? null,
    replaced: newer !== undefined,
  };
  const start = ladderStartOf(clock);
  if (start === null) return { clock, lastToldDueAt: null, signedUpAt: row.signedUpAt.getTime() };
  const [last] = await tx
    .select({ dueAt: max(dunningEvent.dueAt) })
    .from(dunningEvent)
    .where(
      and(
        eq(dunningEvent.tenantId, row.tenantId),
        eq(dunningEvent.subscriptionId, subscriptionId),
        gte(dunningEvent.dueAt, new Date(ladderBeginsAt(start))),
      ),
    );
  return {
    clock,
    lastToldDueAt: last?.dueAt?.getTime() ?? null,
    signedUpAt: row.signedUpAt.getTime(),
  };
}

/** Moves the ladder's next look, or ends it with `null`. */
async function lookAgain(tx: DbTransaction, candidate: NoticeCandidate, at: number | null) {
  await tx
    .update(dunningEvent)
    .set({ nextDueAt: at === null ? null : new Date(at) })
    .where(
      and(
        eq(dunningEvent.tenantId, candidate.tenantId),
        eq(dunningEvent.subscriptionId, candidate.subscriptionId),
        isNotNull(dunningEvent.nextDueAt),
      ),
    );
}

async function companyNameOf(tx: DbTransaction, tenantId: string): Promise<string> {
  const [row] = await tx
    .select({ companyName: tenant.companyName })
    .from(tenant)
    .where(eq(tenant.id, tenantId));
  if (row === undefined) throw new Error(`no company ${tenantId} for a notice`);
  return row.companyName;
}

async function phonesOf(
  tx: DbTransaction,
  owners: readonly { readonly userId: string; readonly language: UiLanguage }[],
): Promise<{ phoneE164: string; language: UiLanguage }[]> {
  if (owners.length === 0) return [];
  const rows = await tx
    .select({ id: userAccount.id, phoneE164: userAccount.phoneE164 })
    .from(userAccount)
    .where(
      inArray(
        userAccount.id,
        owners.map((owner) => owner.userId),
      ),
    );
  return owners.flatMap((owner) => {
    const phone = rows.find((row) => row.id === owner.userId)?.phoneE164;
    return phone === undefined ? [] : [{ phoneE164: phone, language: owner.language }];
  });
}
