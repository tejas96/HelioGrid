import type { VisibilityDomain } from '../authz/cells';
import type { RolePreset } from '../authz/roles';

/**
 * The lists a person keeps under their thumb between Home and More — the arc bar's middle slots
 * (`F7-22`). Proposals, never Quotes (`F6-22`).
 */
export const WORK_DESTINATIONS = ['leads', 'proposals', 'projects', 'people', 'campaigns'] as const;
export type WorkDestination = (typeof WORK_DESTINATIONS)[number];

/**
 * The visibility domain each list is read through. `F2-14`'s lattice has no proposals domain —
 * a proposal is seen with its lead — and `tests/shell/standing-destinations.test.ts` holds that
 * no preset is handed a slot whose list its own visibility calls `none` (`F7-48`).
 */
export const WORK_DESTINATION_DOMAIN = {
  leads: 'leads',
  proposals: 'leads',
  projects: 'projects',
  people: 'people',
  campaigns: 'campaigns',
} as const satisfies Record<WorkDestination, VisibilityDomain>;

/**
 * Home, at most two lists, then More (`F7-48`). A fifth slot, a moved Home or More before a list
 * is a compile error, which is what "never add a fifth slot" (`SCR-SHELL-01` decision 5) needs to
 * hold across ninety screens.
 */
export type StandingDestinationSet =
  | readonly ['home', 'more']
  | readonly ['home', WorkDestination, 'more']
  | readonly ['home', WorkDestination, WorkDestination, 'more'];
export type StandingDestination = StandingDestinationSet[number];

/**
 * `F7-48`'s table, cell for cell. The key is the preset the ladder ranks highest (`M13-10`), never
 * the home in force: the slots follow the PERSON (`SCR-SHELL-01` decision 6), so switching homes
 * never moves one. Every preset is written out.
 */
const STANDING_DESTINATIONS_BY_PRESET = {
  epc_owner: ['home', 'leads', 'projects', 'more'],
  sales_manager: ['home', 'leads', 'proposals', 'more'],
  sales_executive: ['home', 'leads', 'proposals', 'more'],
  survey_engineer: ['home', 'leads', 'more'],
  design_engineer: ['home', 'leads', 'proposals', 'more'],
  project_manager: ['home', 'more'],
  field_technician: ['home', 'more'],
  installation_team_member: ['home', 'more'],
  hr_admin: ['home', 'people', 'more'],
  finance: ['home', 'projects', 'more'],
  operations: ['home', 'leads', 'projects', 'more'],
  marketing: ['home', 'campaigns', 'leads', 'more'],
} as const satisfies Record<RolePreset, StandingDestinationSet>;

/** The bar for the person whose top preset is `preset`. */
export function standingDestinationsFor(preset: RolePreset): StandingDestinationSet {
  return STANDING_DESTINATIONS_BY_PRESET[preset];
}
