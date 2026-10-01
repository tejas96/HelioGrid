import type { RolePreset } from '../authz/roles';
import { type CentreVerb, centreVerbFor } from './centre-verb';
import { type FirstRunMark, firstRunMarksFor } from './coach-marks';
import { type ComposedHome, composedHome, homeFor, homesOf } from './home';
import { type StandingDestinationSet, standingDestinationsFor } from './standing-destinations';

/** Everything the shell shows that the person's presets decide (Law 11). */
export interface ShellView {
  /** Null only for a person who holds no preset — no home to land on. */
  readonly home: ComposedHome | null;
  /** The switcher's list, in ladder order; one entry means no switcher (`M13-10`). */
  readonly homes: readonly RolePreset[];
  readonly centreVerb: CentreVerb | null;
  readonly destinations: StandingDestinationSet | null;
  readonly coachMarks: readonly FirstRunMark[];
}

/**
 * The shell for a person holding `held`, with `chosen` the switcher's pick for this session. The
 * slots follow the PERSON — the ladder-top preset (`F7-48`) — so a switch never moves one; the
 * verb and the marks follow the home in force, so a mark never points at a centre that is gone.
 */
export function shellViewFor(held: readonly RolePreset[], chosen: RolePreset | null): ShellView {
  const home = composedHome(held, chosen);
  const top = homeFor(held);
  const homes = homesOf(held);
  if (home === null || top === null) {
    return { home: null, homes, centreVerb: null, destinations: null, coachMarks: [] };
  }
  const centreVerb = centreVerbFor(home.home);
  return {
    home,
    homes,
    centreVerb,
    destinations: standingDestinationsFor(top),
    coachMarks: firstRunMarksFor({ homes: homes.length, centreVerb }),
  };
}
