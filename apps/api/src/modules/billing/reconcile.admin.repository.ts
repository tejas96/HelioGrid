import { billingCheckout, type Db, subscription, subscriptionInvoice } from '@heliogrid/db';
import { type CollectionKind, MS_PER_DAY, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNotNull, isNull, type SQL } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** One thing the gateway collects on: a subscription or payment link, and how. */
export interface CollectedRef {
  readonly gatewayRef: string;
  readonly collection: CollectionKind;
}

/**
 * The four sets a charge can still land on, read in this order: live converted rows, halts still
 * inside their grace (a charge made before the halt undoes it, `charges.ts`), pages still able
 * to take money, and renewal links still able to (`M12-11`). Each is read on its own partial
 * index, in the ref's order. A new set goes last: an older api handed its cursor ends that run.
 */
const SETS = ['live', 'halted', 'open', 'renewal'] as const;
type CollectedSet = (typeof SETS)[number];

/** Where a run stands: the set it is reading, and the last ref read in it. */
export interface ReconcileCursor {
  readonly set: CollectedSet;
  readonly after: string | null;
}

/** A page opened in a trial may be paid up to its expiry; its message may land a day later. */
const CHECKOUT_POLLED_FOR_MS = MS_PER_DAY;

/**
 * The reconcile's read, across every company. One set at a time, so each page is one keyset read
 * in the database's own order. Every converted row was opened by a checkout, so its rail is that
 * checkout's.
 */
@Injectable()
export class ReconcileAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** One page of `cursor.set`, and the cursor the next page starts from; `null` once all are read. */
  async page(
    cursor: ReconcileCursor,
    size: number,
    now: number,
  ): Promise<{ refs: CollectedRef[]; next: ReconcileCursor | null }> {
    const refs = await this.read(cursor, size, now);
    const last = refs.at(-1);
    if (refs.length === size && last !== undefined) {
      return { refs, next: { set: cursor.set, after: last.gatewayRef } };
    }
    const following = SETS[SETS.indexOf(cursor.set) + 1];
    return { refs, next: following === undefined ? null : { set: following, after: null } };
  }

  private read(cursor: ReconcileCursor, size: number, now: number): Promise<CollectedRef[]> {
    if (cursor.set === 'renewal') return this.renewalLinks(cursor.after, size, now);
    if (cursor.set === 'open') {
      return this.db
        .select({ gatewayRef: billingCheckout.gatewayRef, collection: billingCheckout.collection })
        .from(billingCheckout)
        .where(
          and(
            isNull(billingCheckout.closedAt),
            gt(billingCheckout.expiresAt, new Date(now - CHECKOUT_POLLED_FOR_MS)),
            ...after(billingCheckout.gatewayRef, cursor.after),
          ),
        )
        .orderBy(asc(billingCheckout.gatewayRef))
        .limit(size);
    }
    const state =
      cursor.set === 'live'
        ? inArray(subscription.state, ['active', 'past_due'])
        : and(
            eq(subscription.state, 'halted'),
            gt(subscription.stateEnteredAt, new Date(now - PAST_DUE_GRACE_DAYS * MS_PER_DAY)),
          );
    return this.db
      .select({ gatewayRef: billingCheckout.gatewayRef, collection: billingCheckout.collection })
      .from(subscription)
      .innerJoin(billingCheckout, eq(billingCheckout.gatewayRef, subscription.gatewayRef))
      .where(
        and(
          isNotNull(subscription.gatewayRef),
          state,
          ...after(subscription.gatewayRef, cursor.after),
        ),
      )
      .orderBy(asc(subscription.gatewayRef))
      .limit(size);
  }

  /**
   * Renewal links not yet paid whose due moment is inside the last grace, on
   * `subscription_invoice_open_link_idx`: a bounded few, sorted by ref for the cursor.
   */
  private async renewalLinks(
    afterRef: string | null,
    size: number,
    now: number,
  ): Promise<CollectedRef[]> {
    const rows = await this.db
      .select({ gatewayRef: subscriptionInvoice.gatewayRef })
      .from(subscriptionInvoice)
      .where(
        and(
          inArray(subscriptionInvoice.status, ['issued', 'failed']),
          gt(subscriptionInvoice.dueAt, new Date(now - RENEWAL_POLLED_FOR_MS)),
          ...after(subscriptionInvoice.gatewayRef, afterRef),
        ),
      )
      .orderBy(asc(subscriptionInvoice.gatewayRef))
      .limit(size);
    // An unpaid renewal always holds its link (`subscription_invoice_link_whole`).
    return rows.flatMap(({ gatewayRef }) =>
      gatewayRef === null ? [] : [{ gatewayRef, collection: 'invoice' as const }],
    );
  }
}

/**
 * A renewal link takes money until its row halts: its due moment + the grace. Its message may
 * land a day after, as a checkout page's may.
 */
const RENEWAL_POLLED_FOR_MS = PAST_DUE_GRACE_DAYS * MS_PER_DAY + CHECKOUT_POLLED_FOR_MS;

function after(
  column:
    | typeof billingCheckout.gatewayRef
    | typeof subscription.gatewayRef
    | typeof subscriptionInvoice.gatewayRef,
  ref: string | null,
): SQL[] {
  return ref === null ? [] : [gt(column, ref)];
}

/** The cursor as the workflow carries it between pages: one opaque string. */
export function cursorOf(carried: string | null): ReconcileCursor {
  if (carried === null) return { set: 'live', after: null };
  const split = carried.indexOf(':');
  const set = SETS.find((one) => one === carried.slice(0, split));
  if (split < 0 || set === undefined) throw new Error(`not a reconcile cursor: ${carried}`);
  const ref = carried.slice(split + 1);
  return { set, after: ref === '' ? null : ref };
}

export function carriedOf(cursor: ReconcileCursor): string {
  return `${cursor.set}:${cursor.after ?? ''}`;
}
