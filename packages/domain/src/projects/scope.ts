import { visibilityIn } from '../authz/policy';
import { PROJECTS_VISIBILITY } from '../authz/projects';
import type { RolePreset } from '../authz/roles';

/**
 * Which projects a person may see (`F2-14`, the projects row), as the one predicate every project
 * read applies — the api turns each reach into a clause and ORs them; an id outside answers 404.
 * Resolved from `visibilityIn(roles, 'projects')`, so the held presets are the only input (`F2-15`).
 */

/**
 * The ways a project comes into a narrower scope, each one SQL clause:
 * - `sold_by_me` — the person owned the lead it was won from;
 * - `managed_by_me` — the person is its project manager (ruling 2026-11-10);
 * - `crew_on` — the person is on its crew (`installation_team_member`, assigned job only).
 */
export const PROJECT_REACHES = ['sold_by_me', 'managed_by_me', 'crew_on'] as const;
export type ProjectReach = (typeof PROJECT_REACHES)[number];

export type ProjectScope =
  | { readonly kind: 'all' }
  | { readonly kind: 'reaches'; readonly reaches: readonly ProjectReach[] };

/**
 * What an `own` cell reaches, by its qualifier: the seller's read-only own deals, the manager's own
 * projects. A phrase not read here reaches nothing — a scope fails closed, never wider.
 */
const OWN_CELL_REACH: Readonly<Record<string, ProjectReach>> = {
  '(read-only)': 'sold_by_me',
  projects: 'managed_by_me',
};

function ownReachOf(preset: RolePreset): readonly ProjectReach[] {
  const cell = PROJECTS_VISIBILITY.projects.cells[preset];
  if (!('qualifier' in cell) || cell.qualifier === undefined) return [];
  const reach = OWN_CELL_REACH[cell.qualifier];
  return reach === undefined ? [] : [reach];
}

/**
 * Whether the person reaches projects only as their crew — the installer, whose surface holds no
 * paper and no commercial figure, whoever looks (`M08-43`): only the job and its step photos.
 */
export function seesOnlyTheJob(scope: ProjectScope): boolean {
  return (
    scope.kind === 'reaches' &&
    scope.reaches.length > 0 &&
    scope.reaches.every((reach) => reach === 'crew_on')
  );
}

/**
 * Every project at `all` and at the projects ladder's own `portfolio` rung; a `team` until M10 maps
 * who manages whom reads as what the person sold or manages; `own` as each preset's cell says; and
 * an assigned preset adds the projects whose crew names the person.
 */
export function projectScopeOf(roles: readonly RolePreset[]): ProjectScope {
  const visibility = visibilityIn(roles, 'projects');
  if (visibility.scope === 'all' || visibility.scope === 'portfolio') return { kind: 'all' };
  const rung: readonly ProjectReach[] =
    visibility.scope === 'team'
      ? ['sold_by_me', 'managed_by_me']
      : visibility.scope === 'own'
        ? visibility.grantedBy.flatMap(ownReachOf)
        : [];
  const assigned: readonly ProjectReach[] = visibility.includesAssigned ? ['crew_on'] : [];
  const reaches = new Set([...rung, ...assigned]);
  return { kind: 'reaches', reaches: PROJECT_REACHES.filter((reach) => reaches.has(reach)) };
}
