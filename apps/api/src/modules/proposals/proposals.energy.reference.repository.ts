import { type Db, energyEstimate } from '@heliogrid/db';
import type { Coordinate, EnergyDatabase, MonthlyFigures } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { REFERENCE_DB } from '../../common/db/reference.token';

/**
 * What the energy source answered for a point, read back (`T-M06-033`). No tenant predicate, and
 * that is correct: a point on the map belongs to no company and holds nothing of one.
 */
@Injectable()
export class EnergyEstimateReferenceRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(REFERENCE_DB) private readonly db: Db) {}

  async at(
    point: Coordinate,
  ): Promise<{ readonly database: EnergyDatabase; readonly yieldPerKwp: MonthlyFigures } | null> {
    const [row] = await this.db
      .select({ database: energyEstimate.database, yieldPerKwp: energyEstimate.yieldPerKwp })
      .from(energyEstimate)
      .where(
        and(
          eq(energyEstimate.latitude, point.latitude),
          eq(energyEstimate.longitude, point.longitude),
        ),
      )
      .orderBy(desc(energyEstimate.askedAt))
      .limit(1);
    return row ?? null;
  }
}
