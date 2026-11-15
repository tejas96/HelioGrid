import { type Db, energyEstimate } from '@heliogrid/db';
import type { Coordinate, EnergyDatabase, MonthlyFigures } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * Keeps what the energy source answered for a point (`T-M06-033`): global reference data the
 * runtime role may only read, so the server's own fill writes it on the admin path. A point
 * answered twice at once keeps the first answer.
 */
@Injectable()
export class EnergyEstimateAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async keep(
    point: Coordinate,
    answer: { readonly database: EnergyDatabase; readonly yieldPerKwp: MonthlyFigures },
    askedAt: Date,
  ): Promise<void> {
    await this.db
      .insert(energyEstimate)
      .values({
        latitude: point.latitude,
        longitude: point.longitude,
        database: answer.database,
        yieldPerKwp: answer.yieldPerKwp,
        askedAt,
      })
      .onConflictDoNothing();
  }
}
