import type { BillingHome } from '@heliogrid/contracts';
import { BYTES_PER_GB, billedQuantityOf, type TierLimit } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { BillingHomeRepository, type HomeRow } from './billing-home.repository';
import { monthlyWindowsOf } from './internal/renewal-moments';
import type { UsageWindow } from './usage.repository';
import { UsageService } from './usage.service';

type Meter = BillingHome['usage'][number];

/** At most this many meters show on the home: the two nearest a limit (`SCR-M12-02`, D10). */
const METERS_SHOWN = 2;

/**
 * The meters the ledger holds today (D10) — voice minutes and storage — each against what the plan
 * or the trial includes, nearest its limit first. A meter with no cap (a pay-as-you-go bundle of
 * 0, `unlimited`, `custom`) shows its count alone.
 */
@Injectable()
export class BillingHomeUsageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingHomeRepository) private readonly rows: BillingHomeRepository,
    @Inject(UsageService) private readonly usage: UsageService,
  ) {}

  async nearestLimits(
    tenantId: string,
    row: HomeRow,
    includes: BillingHome['includes'],
    now: number,
  ): Promise<Meter[]> {
    const window = await this.windowOf(tenantId, row, now);
    const voice = await this.usage.billedRollupOf(tenantId, ['voice_minutes'], window);
    const gauge = await this.usage.latestStorageGauge(tenantId);
    const storageCap = capOf(includes.storageGb);
    const meters: Meter[] = [
      {
        meter: 'voice_minutes',
        used: billedQuantityOf('voice_minutes', voice.get('voice_minutes') ?? 0),
        included: capOf(includes.voiceMinutesIncluded),
      },
      {
        meter: 'storage',
        used: gauge?.gaugeBytes ?? 0,
        included: storageCap === null ? null : storageCap * BYTES_PER_GB,
      },
    ];
    return meters.sort((a, b) => shareOf(b) - shareOf(a)).slice(0, METERS_SHOWN);
  }

  /**
   * This cycle so far: the trial's days on a row that never paid; else the current paid period,
   * cut to its calendar month on a yearly cycle, since the book's bundles are per month (`BM-41`).
   */
  private async windowOf(tenantId: string, row: HomeRow, now: number): Promise<UsageWindow> {
    const to = new Date(now);
    const start = await this.rows.paidPeriodStart(tenantId, row.id);
    if (start === null || row.paidPeriodEnd === null) return { from: new Date(row.createdAt), to };
    if (row.cycle !== 'yearly') return { from: new Date(start), to };
    const months = monthlyWindowsOf({ from: new Date(start), to: new Date(row.paidPeriodEnd) });
    const current = months.findLast((month) => month.from.getTime() <= now);
    return { from: current?.from ?? new Date(start), to };
  }
}

/** A limit a meter can be measured against; `null` where none caps it. */
function capOf(limit: TierLimit): number | null {
  return typeof limit === 'number' && limit > 0 ? limit : null;
}

/** How near its limit a meter is; an uncapped meter sorts last. */
function shareOf(meter: Meter): number {
  return meter.included === null ? -1 : meter.used / meter.included;
}
