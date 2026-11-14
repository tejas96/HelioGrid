import { ENERGY_SOURCE_OF_RECORD, type EnergySourceOfRecord } from '@heliogrid/contracts';
import {
  type AreaRef,
  isMonthlyFigures,
  locateArea,
  type MarketPack,
  type PerformanceFields,
} from '@heliogrid/domain';
import { builtInMonthlyYield, builtInYieldTableOf } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EnergyEstimateAdminRepository } from './proposals.energy.admin.repository';
import { EnergyEstimateReferenceRepository } from './proposals.energy.reference.repository';

/** What a fill gives step 4: the yield for 1 kWp, where it came from and how exact its point was. */
export type FilledYield = Pick<PerformanceFields, 'yieldPerKwp' | 'source' | 'grain'>;

/**
 * Step 4's fill (`M06-10`, `F8-08`, `F8-10`, `T-M06-033`): the source of record for the site's
 * point — asked once per point, at 1 kWp, then kept — and, when it does not answer in time, the
 * built-in estimate with its own label, so the step always completes.
 */
@Injectable()
export class ProposalsEnergyService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ENERGY_SOURCE_OF_RECORD) private readonly source: EnergySourceOfRecord,
    @Inject(EnergyEstimateReferenceRepository)
    private readonly kept: EnergyEstimateReferenceRepository,
    @Inject(EnergyEstimateAdminRepository) private readonly keeper: EnergyEstimateAdminRepository,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {}

  /** The yield for a site, or `null` where the market holds neither the place nor an estimate for it. */
  async yieldFor(pack: MarketPack, site: AreaRef): Promise<FilledYield | null> {
    const located = locateArea(pack.formats.areas, site);
    if (located === null) return null;
    const recorded = await this.recordedAt(located.coordinate);
    if (recorded !== null) {
      return {
        yieldPerKwp: recorded.yieldPerKwp,
        source: { kind: 'record', databases: [recorded.database] },
        grain: located.grain,
      };
    }
    const table = builtInYieldTableOf(pack.market);
    const builtIn = table === null ? null : builtInMonthlyYield(table, site);
    return builtIn === null
      ? null
      : { yieldPerKwp: builtIn.yieldPerKwp, source: { kind: 'estimate' }, grain: builtIn.grain };
  }

  /** What the source of record says of a point: its kept answer, else a fresh one, else nothing. */
  private async recordedAt(point: { latitude: number; longitude: number }) {
    const kept = await this.kept.at(point);
    if (kept !== null) return kept;
    try {
      const answer = await this.source.monthlyYield(point);
      if (!isMonthlyFigures(answer.yieldPerKwp)) return null;
      await this.keeper.keep(point, answer, new Date());
      return answer;
    } catch (error) {
      // The source is down, slow, or has no data for the point: the built-in estimate fills it.
      this.logger.warn({ err: error }, 'energy source did not answer');
      return null;
    }
  }
}
