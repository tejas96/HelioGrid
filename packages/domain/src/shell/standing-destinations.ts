import type { VisibilityDomain } from '../authz/cells';
import type { RolePreset } from '../authz/roles';

/**
 * The lists a person keeps under their thumb between Home and More — the arc bar's two middle
 * slots (`F7-22`). Proposals, never Quotes (`F6-22`).
 */
export const WORK_DESTINATIONS = ['leads', 'proposals'] as const;
export type WorkDestination = (typeof WORK_DESTINATIONS)[number];

/**
 * The visibility domain each list is read through. `F2-14`'s lattice has no proposals domain —
 * a proposal is seen with its lead — and `tests/shell/standing-destinations.test.ts` holds that
 * no preset is handed a slot whose list its own visibility calls `none`.
 */
export const WORK_DESTINATION_DOMAIN = {
  leads: 'leads',
  proposals: 'leads',
} as const satisfies Record<WorkDestination, VisibilityDomain>;

/**
 * Exactly four slots, Home first and More last. A fifth slot or a moved Home is a compile error,
 * which is what "never add a fifth slot" (`SCR-SHELL-01` decision 5) needs to hold across ninety
 * screens.
 */
export type StandingDestinationSet = readonly ['home', WorkDestination, WorkDestination, 'more'];
export type StandingDestination = StandingDestinationSet[number];

const SALES_DESTINATIONS: StandingDestinationSet = ['home', 'leads', 'proposals', 'more'];

/**
 * The slots follow the PERSON, not the home in force (`SCR-SHELL-01` decision 6): the key is the
 * preset the ladder ranks highest (`M13-10`), so switching homes never moves a slot. A cell is
 * the design's or `null`: a preset whose two lists no PRD row names holds `null` until its
 * home's task names them (Law 9). Every preset is written out.
 */
const STANDING_DESTINATIONS_BY_PRESET = {
  epc_owner: SALES_DESTINATIONS,
  sales_manager: SALES_DESTINATIONS,
  sales_executive: SALES_DESTINATIONS,
  survey_engineer: null,
  design_engineer: null,
  project_manager: null,
  field_technician: null,
  installation_team_member: null,
  hr_admin: null,
  finance: null,
  operations: null,
  marketing: null,
} as const satisfies Record<RolePreset, StandingDestinationSet | null>;

/**
 * The four slots for the person whose top preset is `preset` — `null` where none are named
 * yet.
 */
export function standingDestinationsFor(preset: RolePreset): StandingDestinationSet | null {
  return STANDING_DESTINATIONS_BY_PRESET[preset];
}
