import {
  billingCheckout,
  type DbTransaction,
  invoiceLine,
  subscription,
  subscriptionInvoice,
  subscriptionPlanChange,
} from '@heliogrid/db';
import {
  type BillingCycle,
  type CollectionKind,
  collectionRoute,
  type MarketPack,
  type Tier,
  tierBand,
} from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { recordAuditEntry } from '../audit/audit.public';
import type { LockedSubscription } from './charge-standing.admin.repository';
import { type LimitsFor, recomputeEntitlements } from './entitlement.admin.repository';

/** The plan a row moves to: its tier and cycle, the price row and the rail that collects it. */
export interface PlanMove {
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly planPriceId: string;
  readonly collection: CollectionKind;
}

/** The rail the pack's ladder collects a plan on (`M12-11`). */
export function collectionOf(pack: MarketPack, tier: Tier, cycle: BillingCycle): CollectionKind {
  return collectionRoute(pack.paymentRails, tierBand(tier), cycle).collection;
}

/**
 * Moves a held row wholly onto another plan in the caller's transaction (`M12-48`, `M12-49`): its
 * tier, cycle, price row and rail, its limits rewritten for the new tier at once (`M12-16`), and
 * audit `billing.plan_changed` as the Owner's act. Its paid period's end is kept. A change still
 * scheduled is replaced — unless it is the one being applied — so a row holds one change at a
 * time. A row a link collected that moves to a mandate rail holds no mandate yet: it is marked
 * as one whose next period renews through a fresh hosted page.
 */
export async function movePlan(
  tx: DbTransaction,
  held: LockedSubscription,
  to: PlanMove,
  act: {
    readonly limitsFor: LimitsFor;
    readonly actorUserId: string | null;
    readonly now: number;
    readonly applying?: string;
  },
): Promise<void> {
  const freshPageNeeded =
    held.mandateEndingAt === null && held.collection === 'invoice' && to.collection === 'mandate';
  await tx
    .update(subscription)
    .set({
      tier: to.tier,
      cycle: to.cycle,
      planPriceId: to.planPriceId,
      collection: to.collection,
      ...(freshPageNeeded ? { mandateEndingAt: new Date(act.now) } : {}),
    })
    .where(eq(subscription.id, held.id));
  if (act.applying === undefined) await settleScheduled(tx, held, 'replaced', act.now);
  await recomputeEntitlements(tx, {
    tenantId: held.tenantId,
    subscriptionId: held.id,
    base: act.limitsFor(to.tier),
    now: act.now,
  });
  if (act.actorUserId === null) return;
  await recordAuditEntry(tx, {
    tenantId: held.tenantId,
    eventType: 'billing.plan_changed',
    actorKind: 'tenant_user',
    actorRef: act.actorUserId,
    occurredAt: new Date(act.now),
    blocked: false,
    subjectKind: 'subscription',
    subjectRef: held.id,
    changePayload: null,
  });
}

/** Settles the row's scheduled change, if any; answers its id. */
export async function settleScheduled(
  tx: DbTransaction,
  held: Pick<LockedSubscription, 'id' | 'tenantId'>,
  status: 'replaced' | 'withdrawn' | 'applied',
  at: number,
): Promise<string | null> {
  const [settled] = await tx
    .update(subscriptionPlanChange)
    .set({ status, settledAt: new Date(at) })
    .where(
      and(
        eq(subscriptionPlanChange.tenantId, held.tenantId),
        eq(subscriptionPlanChange.subscriptionId, held.id),
        eq(subscriptionPlanChange.status, 'scheduled'),
      ),
    )
    .returning({ id: subscriptionPlanChange.id });
  return settled?.id ?? null;
}

/**
 * The mandate a plan change must stop at its cycle's end (`M12-57`): the row's own, while it
 * still collects. `null` for a link, or a mandate already told to end — the gateway is asked once.
 */
export function mandateToEnd(held: LockedSubscription): string | null {
  if (held.collection !== 'mandate' || held.mandateEndingAt !== null) return null;
  return held.gatewayRef;
}

/** Records that the row's mandate was told to end at its cycle (`M12-57`). */
export async function markMandateEnding(
  tx: Pick<DbTransaction, 'update'>,
  subscriptionId: string,
  at: number,
): Promise<void> {
  await tx
    .update(subscription)
    .set({ mandateEndingAt: new Date(at) })
    .where(eq(subscription.id, subscriptionId));
}

/**
 * A row whose mandate a plan change ended renews through a fresh hosted page (`M12-57`, D387):
 * once that page's renewal is paid, the row is collected on it — a new mandate's later debits
 * land on the row by its ref — and it collects again. The page is kept as the row's closed
 * checkout, as every page a row is collected on is, so the reconcile, the overage sweep and the
 * mandate's own page read its rail from the one place they always have.
 */
export async function adoptRenewalPage(
  tx: DbTransaction,
  held: LockedSubscription,
  renewal: { readonly invoiceId: string; readonly gatewayRef: string; readonly at: number },
  pack: MarketPack,
): Promise<void> {
  if (held.mandateEndingAt === null || held.tier === null || held.cycle === null) return;
  const [page] = await tx
    .select({
      hostedUrl: subscriptionInvoice.hostedUrl,
      dueAt: subscriptionInvoice.dueAt,
      planPriceId: invoiceLine.planPriceId,
    })
    .from(subscriptionInvoice)
    .innerJoin(
      invoiceLine,
      and(eq(invoiceLine.invoiceId, subscriptionInvoice.id), eq(invoiceLine.position, 0)),
    )
    .where(
      and(
        eq(subscriptionInvoice.tenantId, held.tenantId),
        eq(subscriptionInvoice.id, renewal.invoiceId),
      ),
    )
    .limit(1);
  if (page?.hostedUrl == null || page.dueAt === null || page.planPriceId === null) return;
  const collection = collectionOf(pack, held.tier, held.cycle);
  const at = new Date(renewal.at);
  await tx
    .insert(billingCheckout)
    .values({
      tenantId: held.tenantId,
      subscriptionId: held.id,
      planPriceId: page.planPriceId,
      collection,
      gatewayRef: renewal.gatewayRef,
      hostedUrl: page.hostedUrl,
      expiresAt: page.dueAt,
      openedAt: at,
      closedAt: at,
    })
    .onConflictDoNothing();
  await tx
    .update(subscription)
    .set({ gatewayRef: renewal.gatewayRef, collection, mandateEndingAt: null })
    .where(eq(subscription.id, held.id));
}
