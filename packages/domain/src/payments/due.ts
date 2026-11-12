import { chainIndexOf } from '../projects/machine';
import type { ProjectChainStage, ProjectStage } from '../projects/stages';

/**
 * When a part fell due (`M11-11`, `M11-12`): the moment the project first REACHED its stage
 * (owner ruling 2026-11-10) — a later stage counts, so a skipped stage is passed. A move back
 * below it takes the due-ness away again only while nobody has asked for that money or been paid
 * any of it (ruling 2026-11-10): once a customer was asked, the part stays due. A cancel moves
 * nothing either way — what was owed at the cancel is still owed (`M11-50`).
 */

/** One row of the project's stage history: where it went, and when. */
export interface StageArrival {
  readonly to: ProjectStage;
  readonly at: number;
}

/**
 * The instant the part became due, or `null` while it is not. `arrivals` are oldest first; `held`
 * is whether the part was asked for or paid — what keeps it due after a move back.
 */
export function dueSinceOf(
  dueOnStage: ProjectChainStage,
  arrivals: readonly StageArrival[],
  held: boolean,
): number | null {
  const needed = chainIndexOf(dueOnStage);
  let since: number | null = null;
  for (const arrival of arrivals) {
    if (arrival.to === 'cancelled') continue;
    const reached = chainIndexOf(arrival.to) >= needed;
    if (reached && since === null) since = arrival.at;
    if (!reached && !held) since = null;
  }
  return since;
}
