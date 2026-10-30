import {
  type Db,
  type DbTransaction,
  entitlementOverride,
  subscription,
  tenantMembership,
} from '@heliogrid/db';
import {
  creditRefusal,
  type EntitlementKey,
  extendedTrialEndsAt,
  LIVE_BILLING_STATES,
  type Tier,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recordAuditEntry } from '../audit/audit.public';
import { type LimitsFor, recomputeEntitlements } from './entitlement.admin.repository';

/** A live subscription, held for the rest of its transaction. */
interface HeldSubscription {
  readonly id: string;
  readonly tenantId: string;
  readonly state: (typeof LIVE_BILLING_STATES)[number];
  readonly tier: Tier | null;
  readonly trialEndsAt: Date | null;
}

/** Support's act, as the command hands it in: who, why and when. */
export interface StaffAct {
  readonly tenantId: string;
  readonly staffUserId: string;
  readonly reason: string;
  readonly now: number;
}

export type OverrideIssued =
  | { readonly kind: 'issued'; readonly overrideId: string }
  | { readonly kind: 'refused'; readonly reason: string };

/**
 * Support's audited acts (`M12-19`, `M12-52`): each writes its ledger row, its audit entry and what
 * it changes in one transaction, holding the company's live subscription `FOR UPDATE` first, as a
 * charge does, so a credit and a charge never interleave their recomputes.
 */
@Injectable()
export class EntitlementOverrideAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** `M12-19` — a goodwill credit on one counted key, its audit entry and the recompute, together. */
  async issueCredit(
    act: StaffAct,
    credit: { readonly key: EntitlementKey; readonly amount: number },
    limitsFor: LimitsFor,
  ): Promise<OverrideIssued> {
    return this.db.transaction(async (tx) => {
      if (await isMember(tx, act)) return refused(NOT_STAFF);
      const held = await holdLive(tx, act.tenantId);
      if (held === null) return refused('the company holds no live subscription');
      const base = limitsFor(held.tier);
      const onBook = base.find((one) => one.key === credit.key);
      if (onBook === undefined) return refused(`no limit is kept under ${credit.key}`);
      const refusal = creditRefusal(onBook.limit, credit.amount);
      if (refusal !== null) return refused(refusal);
      const overrideId = await recordOverride(tx, held, act, {
        kind: 'goodwill_credit',
        entitlementKey: credit.key,
        credit: credit.amount,
      });
      await recordAuditEntry(tx, staffEntry('billing.goodwill_credit_issued', act, overrideId));
      await recomputeEntitlements(tx, {
        tenantId: held.tenantId,
        subscriptionId: held.id,
        base,
        now: act.now,
      });
      return { kind: 'issued', overrideId };
    });
  }

  /**
   * `M12-52` — the trial's one extension: its end moves by seven days, only while it is a trial
   * that has not ended, so the timers' expiry (which reads only ended trials) never meets it.
   */
  async extendTrial(act: StaffAct): Promise<OverrideIssued> {
    return this.db.transaction(async (tx) => {
      if (await isMember(tx, act)) return refused(NOT_STAFF);
      const held = await holdLive(tx, act.tenantId);
      if (held?.state !== 'trialing' || held.trialEndsAt === null) {
        return refused('only a company on its trial can have it extended');
      }
      if (held.trialEndsAt.getTime() <= act.now) return refused('the trial has already ended');
      const [extended] = await tx
        .select({ id: entitlementOverride.id })
        .from(entitlementOverride)
        .where(
          and(
            eq(entitlementOverride.tenantId, act.tenantId),
            eq(entitlementOverride.kind, 'trial_extension'),
          ),
        )
        .limit(1);
      if (extended !== undefined) return refused('this company’s trial was extended once already');
      const overrideId = await recordOverride(tx, held, act, {
        kind: 'trial_extension',
        entitlementKey: null,
        credit: null,
      });
      await tx
        .update(subscription)
        .set({
          trialEndsAt: new Date(extendedTrialEndsAt(held.trialEndsAt.getTime())),
        })
        .where(eq(subscription.id, held.id));
      await recordAuditEntry(tx, staffEntry('billing.trial_extended', act, overrideId));
      return { kind: 'issued', overrideId };
    });
  }
}

/**
 * `F2-24` — platform staff are an account with no membership in the company whose log the entry
 * sits in; one of the company's own people named as staff would forge that entry.
 */
const NOT_STAFF = 'platform staff hold no membership in the company';

async function isMember(tx: DbTransaction, act: StaffAct): Promise<boolean> {
  const [held] = await tx
    .select({ id: tenantMembership.id })
    .from(tenantMembership)
    .where(
      and(
        eq(tenantMembership.tenantId, act.tenantId),
        eq(tenantMembership.userAccountId, act.staffUserId),
      ),
    )
    .limit(1);
  return held !== undefined;
}

/** The company's live subscription, locked; `null` when it holds none. */
async function holdLive(tx: DbTransaction, tenantId: string): Promise<HeldSubscription | null> {
  const [row] = await tx
    .select({
      id: subscription.id,
      tenantId: subscription.tenantId,
      state: subscription.state,
      tier: subscription.tier,
      trialEndsAt: subscription.trialEndsAt,
    })
    .from(subscription)
    .where(
      and(
        eq(subscription.tenantId, tenantId),
        inArray(subscription.state, [...LIVE_BILLING_STATES]),
      ),
    )
    .for('update');
  if (row === undefined) return null;
  return { ...row, state: row.state as HeldSubscription['state'] };
}

async function recordOverride(
  tx: DbTransaction,
  held: HeldSubscription,
  act: StaffAct,
  what: Pick<typeof entitlementOverride.$inferInsert, 'kind' | 'entitlementKey' | 'credit'>,
): Promise<string> {
  const [row] = await tx
    .insert(entitlementOverride)
    .values({
      tenantId: held.tenantId,
      subscriptionId: held.id,
      ...what,
      reason: act.reason,
      issuedBy: act.staffUserId,
      issuedAt: new Date(act.now),
    })
    .returning({ id: entitlementOverride.id });
  if (!row) throw new Error('entitlement_override insert returned no row');
  return row.id;
}

function staffEntry(
  eventType: 'billing.goodwill_credit_issued' | 'billing.trial_extended',
  act: StaffAct,
  overrideId: string,
) {
  return {
    tenantId: act.tenantId,
    eventType,
    actorKind: 'platform_staff' as const,
    actorRef: act.staffUserId,
    occurredAt: new Date(act.now),
    blocked: false,
    subjectKind: 'entitlement_override' as const,
    subjectRef: overrideId,
    changePayload: null,
  };
}

function refused(reason: string): OverrideIssued {
  return { kind: 'refused', reason };
}
