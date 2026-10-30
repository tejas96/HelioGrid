import {
  bookEntitlements,
  ENTITLEMENT_KEYS,
  type Entitlement,
  type EntitlementKey,
  limitOf,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MarketPackService } from '../market/market.public';
import { EntitlementAdminRepository, type LimitsFor } from './entitlement.admin.repository';
import { EntitlementRepository } from './entitlement.repository';
import {
  EntitlementOverrideAdminRepository,
  type OverrideIssued,
  type StaffAct,
} from './entitlement-override.admin.repository';

/** At most this many companies repaired per timers run, so one run stays inside its step. */
const REPAIR_BATCH = 100;

/**
 * Entitlements (`M12-16`): the hot-path read the gates make, the book's limits for a market, the
 * timers' repair, and support's audited overrides (`M12-19`, `M12-52`). What a limit IS is
 * domain's (`commerce/entitlements.ts`); this reads, asks and writes.
 */
@Injectable()
export class EntitlementService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(EntitlementRepository) private readonly scoped: EntitlementRepository,
    @Inject(EntitlementAdminRepository) private readonly admin: EntitlementAdminRepository,
    @Inject(EntitlementOverrideAdminRepository)
    private readonly overrides: EntitlementOverrideAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EntitlementService.name);
  }

  /**
   * A company's current limits by key, or `null` while none is written — the repair writes them
   * within a minute. A key this code does not know (a newer release wrote it) is left out.
   */
  async limitsOf(tenantId: string): Promise<ReadonlyMap<EntitlementKey, Entitlement> | null> {
    const rows = await this.scoped.limitsOf(tenantId);
    if (rows.length === 0) return null;
    const known = new Set<string>(ENTITLEMENT_KEYS);
    return new Map(
      rows
        .filter((row) => known.has(row.key))
        .map((row) => {
          const key = row.key as EntitlementKey;
          const limit = limitOf(row.limitKind, row.limitValue);
          return [key, { key, limit, source: row.source }];
        }),
    );
  }

  /** The book's limits in a market, read once, for a transaction that is about to open. */
  async limitsIn(marketCode: string): Promise<LimitsFor> {
    const { priceBook } = await this.markets.currentPackOf(marketCode);
    return (tier) => bookEntitlements(priceBook, tier);
  }

  /**
   * Recomputes the live companies whose limits are missing, or still the trial's after paying. A
   * company whose book cannot give its limits is logged and passed over, so it never holds back
   * the rest of the batch.
   */
  async repair(now: number): Promise<number> {
    const books = new Map<string, LimitsFor>();
    let repaired = 0;
    for (const { subscriptionId, marketCode } of await this.admin.needingRecompute(REPAIR_BATCH)) {
      try {
        const limitsFor = books.get(marketCode) ?? (await this.limitsIn(marketCode));
        books.set(marketCode, limitsFor);
        if (await this.admin.recompute(subscriptionId, limitsFor, now)) repaired += 1;
      } catch (error) {
        this.logger.error(
          { err: error, subscriptionId },
          'a company\u2019s limits could not be written',
        );
      }
    }
    return repaired;
  }

  /** `M12-19` — support raises one counted key for the life of the company's subscription. */
  async issueCredit(
    act: StaffAct,
    credit: { readonly key: EntitlementKey; readonly amount: number },
  ): Promise<OverrideIssued> {
    const marketCode = await this.admin.marketOf(act.tenantId);
    if (marketCode === null) return { kind: 'refused', reason: 'no such company' };
    return this.overrides.issueCredit(act, credit, await this.limitsIn(marketCode));
  }

  /** `M12-52` — support gives a trial its one seven-day extension. */
  async extendTrial(act: StaffAct): Promise<OverrideIssued> {
    if ((await this.admin.marketOf(act.tenantId)) === null) {
      return { kind: 'refused', reason: 'no such company' };
    }
    return this.overrides.extendTrial(act);
  }
}
