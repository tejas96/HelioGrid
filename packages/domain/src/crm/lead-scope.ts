import { CRM_VISIBILITY } from '../authz/crm';
import { visibilityIn } from '../authz/policy';
import type { RolePreset } from '../authz/roles';
import type { ResolvedVisibility } from '../authz/visibility';

/**
 * Which leads a person may see and act on (`F2-12`…`F2-14`), as the one predicate every lead read
 * and act applies — the api turns each reach into a clause and ORs them; an id outside answers 404.
 * Resolved from `visibilityIn(roles, 'leads')`, so the held presets are the only input (`F2-15`).
 */

/**
 * The ways a lead comes into a narrower scope, each one SQL clause:
 * - `owned_by_me` — the lead's owner is the person;
 * - `unassigned_queue` — the lead has no owner;
 * - `my_unassigned_captures` — the person captured it and it has no owner yet;
 * - `my_booked_visits` — a booked visit on the lead names the person.
 */
export const LEAD_REACHES = [
  'owned_by_me',
  'unassigned_queue',
  'my_unassigned_captures',
  'my_booked_visits',
] as const;
export type LeadReach = (typeof LEAD_REACHES)[number];

/** Every lead of the tenant, or the leads any of these reaches finds — none when the list is empty. */
export type LeadScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'reaches'; readonly reaches: readonly LeadReach[] };

/**
 * What an `own` cell of the leads row reaches: a bare `own` is the person's owned leads; a cell
 * qualified by a phrase reaches what that phrase says, and a phrase not read here reaches nothing
 * — a scope fails closed, never wider (`matrix-mirrors-f2` holds the phrases to the PRD).
 */
const OWN_CELL_REACH: Readonly<Record<string, LeadReach>> = {
  'captures until triage': 'my_unassigned_captures',
};

function ownReachOf(preset: RolePreset): readonly LeadReach[] {
  const cell = CRM_VISIBILITY.leads.cells[preset];
  if (!('qualifier' in cell) || cell.qualifier === undefined) return ['owned_by_me'];
  const reach = OWN_CELL_REACH[cell.qualifier];
  return reach === undefined ? [] : [reach];
}

/**
 * The widest rung the presets hold, read as reaches:
 * - `team` — own plus the unassigned queue, until M10 maps who manages whom; an unmapped team never
 *   widens past that (data-model §3, `employee_record`);
 * - `own` — each granting preset's own cell, read as `OWN_CELL_REACH` says;
 * - a rung of another domain's ladder, or none — nothing.
 */
function rungReaches(visibility: ResolvedVisibility): readonly LeadReach[] {
  switch (visibility.scope) {
    case 'team':
      return ['owned_by_me', 'unassigned_queue'];
    case 'own':
      return visibility.grantedBy.flatMap(ownReachOf);
    default:
      return [];
  }
}

/**
 * Every lead at `all`; otherwise the rung's reaches beside what is assigned to the person — the
 * leads whose booked visit names them. A cell that reads through projects (`project_manager`,
 * `operations`) reaches nothing until projects exist (M08).
 */
export function leadScopeOf(roles: readonly RolePreset[]): LeadScope {
  const visibility = visibilityIn(roles, 'leads');
  if (visibility.scope === 'all') return { kind: 'all' };
  const assigned: readonly LeadReach[] = visibility.includesAssigned ? ['my_booked_visits'] : [];
  const reaches = new Set([...rungReaches(visibility), ...assigned]);
  return { kind: 'reaches', reaches: LEAD_REACHES.filter((reach) => reaches.has(reach)) };
}
