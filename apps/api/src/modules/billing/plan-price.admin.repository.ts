import { type Db, planPrice } from '@heliogrid/db';
import { type BillingCycle, type MinorUnits, minorUnits, type Tier } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, type SQLWrapper } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** One plan price: a tier on a cycle as the gateway sells it (`M12-12`). */
export interface PlanPriceRow {
  readonly id: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly currencyCode: string;
  /** What the gateway collects: the list price, plus the scheme's tax once the platform is registered (`F1-29`). */
  readonly collectedMinor: MinorUnits;
  readonly gatewayPlanRef: string;
}

export interface PlanPriceKey {
  readonly marketCode: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly currencyCode: string;
}

const columns = {
  id: planPrice.id,
  tier: planPrice.tier,
  cycle: planPrice.cycle,
  currencyCode: planPrice.currencyCode,
  collectedMinor: planPrice.collectedMinor,
  gatewayPlanRef: planPrice.gatewayPlanRef,
};

/** A key as values, or as the columns of a row the query already holds. */
type KeyOf<T> = { readonly [K in keyof T]: T[K] | SQLWrapper };

/**
 * The current row of a market × tier × cycle × currency — the latest written — on
 * `plan_price_current_idx`. Every sale reads it: a new checkout, a reactivation, an upgrade and a
 * renewal bill today's book, never a row a company bought earlier (`M12-57`).
 */
export function currentPlanPrice(db: Db, key: KeyOf<PlanPriceKey>) {
  return db
    .select(columns)
    .from(planPrice)
    .where(
      and(
        eq(planPrice.marketCode, key.marketCode),
        eq(planPrice.tier, key.tier),
        eq(planPrice.cycle, key.cycle),
        eq(planPrice.currencyCode, key.currencyCode),
      ),
    )
    .orderBy(desc(planPrice.createdAt))
    .limit(1);
}

/** The plan prices: global rows no company owns, so the admin path reads and writes them. */
@Injectable()
export class PlanPriceAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The current row of this market × tier × cycle × currency (`currentPlanPrice`). */
  async current(key: PlanPriceKey): Promise<PlanPriceRow | null> {
    const [row] = await currentPlanPrice(this.db, key);
    return row === undefined ? null : { ...row, collectedMinor: minorUnits(row.collectedMinor) };
  }

  /**
   * Points a row at a new plan object. Only for a ref the bound gateway does not hold: such a ref
   * can open no page, and a checkout reads its row's tier and cycle, never the ref it opened with.
   */
  async replaceGatewayPlan(id: string, gatewayPlanRef: string): Promise<void> {
    await this.db.update(planPrice).set({ gatewayPlanRef }).where(eq(planPrice.id, id));
  }

  /** `false` when this pack version already wrote the row: a second publish writes nothing. */
  async insert(
    row: PlanPriceKey & {
      readonly packVersion: string;
      readonly listMinor: number;
      readonly collectedMinor: number;
      readonly gatewayPlanRef: string;
      readonly createdAt: number;
    },
  ): Promise<boolean> {
    const written = await this.db
      .insert(planPrice)
      .values({ ...row, createdAt: new Date(row.createdAt) })
      .onConflictDoNothing()
      .returning({ id: planPrice.id });
    return written.length > 0;
  }
}
