import { billingCheckout, type Db, subscription, tenant, uuidv7 } from '@heliogrid/db';
import { type BillingState, type CollectionKind, LIVE_BILLING_STATES } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** A company's live subscription, with what a checkout needs to know about the company. */
export interface CheckoutStanding {
  readonly subscriptionId: string;
  readonly state: BillingState;
  readonly trialEndsAt: number | null;
  readonly marketCode: string;
  readonly currencyCode: string;
}

/** A hosted checkout still able to take money. */
export interface OpenCheckout {
  readonly id: string;
  readonly planPriceId: string;
  readonly collection: CollectionKind;
  readonly gatewayRef: string;
  readonly hostedUrl: string;
  /** The gateway was asked to cancel it: its page is never handed out again. */
  readonly cancelRequested: boolean;
}

/**
 * The hosted checkouts. Rows are tenant-scoped and `app_user` holds SELECT alone: the gateway's
 * messages close them across tenants, so every write is on the admin path, and every read here
 * carries the company's own predicate.
 */
@Injectable()
export class CheckoutAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** A checkout's id, minted before its row: the gateway carries it on every message about it. */
  newId(): string {
    return uuidv7();
  }

  /** The company's one live subscription (`M12-04`), or `null` when it holds none. */
  async standingOf(tenantId: string): Promise<CheckoutStanding | null> {
    const [row] = await this.db
      .select({
        subscriptionId: subscription.id,
        state: subscription.state,
        trialEndsAt: subscription.trialEndsAt,
        marketCode: tenant.marketCode,
        currencyCode: tenant.currencyCode,
      })
      .from(subscription)
      .innerJoin(tenant, eq(tenant.id, subscription.tenantId))
      .where(
        and(
          eq(subscription.tenantId, tenantId),
          inArray(subscription.state, [...LIVE_BILLING_STATES]),
        ),
      )
      .limit(1);
    if (row === undefined) return null;
    return { ...row, trialEndsAt: row.trialEndsAt?.getTime() ?? null };
  }

  async openOf(tenantId: string, subscriptionId: string): Promise<OpenCheckout | null> {
    const [row] = await this.db
      .select({
        id: billingCheckout.id,
        planPriceId: billingCheckout.planPriceId,
        collection: billingCheckout.collection,
        gatewayRef: billingCheckout.gatewayRef,
        hostedUrl: billingCheckout.hostedUrl,
        cancelRequestedAt: billingCheckout.cancelRequestedAt,
      })
      .from(billingCheckout)
      .where(
        and(
          eq(billingCheckout.tenantId, tenantId),
          eq(billingCheckout.subscriptionId, subscriptionId),
          isNull(billingCheckout.closedAt),
        ),
      )
      .limit(1);
    if (row === undefined) return null;
    const { cancelRequestedAt, ...open } = row;
    return { ...open, cancelRequested: cancelRequestedAt !== null };
  }

  /** Written before the gateway is asked to cancel, so a lost answer never hands the page out. */
  async cancelRequested(tenantId: string, checkoutId: string, at: number): Promise<void> {
    await this.db
      .update(billingCheckout)
      .set({ cancelRequestedAt: new Date(at) })
      .where(
        and(
          eq(billingCheckout.tenantId, tenantId),
          eq(billingCheckout.id, checkoutId),
          isNull(billingCheckout.cancelRequestedAt),
        ),
      );
  }

  /** `false` when another checkout closed it first. */
  async close(tenantId: string, checkoutId: string, at: number): Promise<boolean> {
    const closed = await this.db
      .update(billingCheckout)
      .set({ closedAt: new Date(at) })
      .where(
        and(
          eq(billingCheckout.tenantId, tenantId),
          eq(billingCheckout.id, checkoutId),
          isNull(billingCheckout.closedAt),
        ),
      )
      .returning({ id: billingCheckout.id });
    return closed.length > 0;
  }

  /** `false` when the subscription already holds an open checkout: one page at a time. */
  async insert(row: {
    readonly id: string;
    readonly tenantId: string;
    readonly subscriptionId: string;
    readonly planPriceId: string;
    readonly collection: CollectionKind;
    readonly gatewayRef: string;
    readonly hostedUrl: string;
    readonly expiresAt: number;
    readonly openedAt: number;
  }): Promise<boolean> {
    const written = await this.db
      .insert(billingCheckout)
      .values({
        ...row,
        expiresAt: new Date(row.expiresAt),
        openedAt: new Date(row.openedAt),
      })
      .onConflictDoNothing()
      .returning({ id: billingCheckout.id });
    return written.length > 0;
  }
}
