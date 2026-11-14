import { energyEstimate } from '@heliogrid/db';
import { type AreaRef, IN_PACK, locateArea } from '@heliogrid/domain';
import { and, eq, or } from 'drizzle-orm';
import type { ProposalsWorld } from './support';

/**
 * Forgets what the energy source answered at the points of the sites given, so a proof reads
 * only what it asked itself: the cache is shared reference data, and a run of live QA on the same
 * database keeps a real database's answer for a district a proof also uses. The points are the
 * published pack's (`publishIndiaPack`), as the fill locates them.
 */
export async function forgetEnergyAnswersAt(
  world: ProposalsWorld,
  sites: readonly AreaRef[],
): Promise<void> {
  const points = sites.flatMap((site) => {
    const located = locateArea(IN_PACK.formats.areas, site);
    return located === null ? [] : [located.coordinate];
  });
  if (points.length === 0) return;
  await world.pools.admin.db
    .delete(energyEstimate)
    .where(
      or(
        ...points.map((point) =>
          and(
            eq(energyEstimate.latitude, point.latitude),
            eq(energyEstimate.longitude, point.longitude),
          ),
        ),
      ),
    );
}
