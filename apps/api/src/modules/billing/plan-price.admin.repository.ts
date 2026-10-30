import { type Db, planPrice } from '@heliogrid/db';
import { type BillingCycle, type MinorUnits, minorUnits, type Tier } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** One plan price: a tier on a cycle as the gateway sells it (`M12-12`). */
export interface PlanPriceRow {
  readonly id: string;
  readonly tier: Tier;
  readonly cycle: BillingCycle;
  readonly currencyCode: string;
  /** What the gateway collects, tax included. */
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

/** The plan prices: global rows no company owns, so the admin path reads and writes them. */
@Injectable()
export class PlanPriceAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The latest row of this market × tier × cycle × currency: the one a new checkout sells. */
  async current(key: PlanPriceKey): Promise<PlanPriceRow | null> {
    const [row] = await this.db
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
    return row === undefined ? null : { ...row, collectedMinor: minorUnits(row.collectedMinor) };
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
