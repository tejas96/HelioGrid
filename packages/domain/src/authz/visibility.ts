import type { LadderScope, VisibilityCell, VisibilityDomain, VisibilityRow } from './cells';
import { CRM_VISIBILITY } from './crm';
import { FIELD_VISIBILITY } from './field';
import { HR_VISIBILITY } from './hr';
import { MARKETING_VISIBILITY } from './marketing';
import { PROJECTS_VISIBILITY } from './projects';

/**
 * Each domain's ladder, narrowest first (F2-14): leads Own ⊂ Team ⊂ All; projects Own ⊂ Team ⊂
 * Portfolio ⊂ All — F2-14 names the rungs that differ from leads, and §F2.5-M08's Team cell for
 * Sales Manager is the fourth; field work Own ⊂ Team ⊂ All; people and money Own ⊂ All;
 * campaigns has All alone, its one narrower cell being a read of results carried as a
 * qualifier. Widest wins INSIDE a domain and a wide scope in one domain never widens another.
 */
export const DOMAIN_LADDERS: Readonly<Record<VisibilityDomain, readonly LadderScope[]>> = {
  leads: ['own', 'team', 'all'],
  projects: ['own', 'team', 'portfolio', 'all'],
  field_work: ['own', 'team', 'all'],
  people: ['own', 'all'],
  money: ['own', 'all'],
  campaigns: ['all'],
};

/**
 * The visibility rows §F2.5 fixes, by domain. `money` has no fixed row: F2-14 names the domain
 * and no table carries its cells, so it stays ABSENT until the payments slice appends one —
 * absent resolves to none, never to a guess.
 */
export const VISIBILITY_MATRIX: Readonly<Partial<Record<VisibilityDomain, VisibilityRow>>> = {
  ...CRM_VISIBILITY,
  ...MARKETING_VISIBILITY,
  ...PROJECTS_VISIBILITY,
  ...FIELD_VISIBILITY,
  ...HR_VISIBILITY,
};

/** A reach into this domain THROUGH another domain's rung — never folded onto this ladder, never dropped. */
export interface ReachedThrough {
  readonly domain: VisibilityDomain;
  readonly scope: LadderScope;
}

export interface ResolvedVisibility {
  readonly scope: LadderScope | 'none';
  /** An assigned-only preset sees what is assigned to it beside — never instead of — its rung. */
  readonly includesAssigned: boolean;
  readonly through: readonly ReachedThrough[];
}

export const NO_VISIBILITY: ResolvedVisibility = {
  scope: 'none',
  includesAssigned: false,
  through: [],
};

/**
 * Widest wins on the domain's ladder (F2-13); `assigned` is noted beside it, `none` never wins,
 * and a cell that reads through another domain is carried out whole for the caller to join.
 */
export function resolveVisibility(
  cells: readonly VisibilityCell[],
  ladder: readonly LadderScope[],
): ResolvedVisibility {
  let best = -1;
  let includesAssigned = false;
  const through: ReachedThrough[] = [];
  for (const cell of cells) {
    if (cell.through !== undefined) {
      if (cell.scope !== 'assigned' && cell.scope !== 'none') {
        through.push({ domain: cell.through, scope: cell.scope });
      }
      continue;
    }
    if (cell.scope === 'assigned') {
      includesAssigned = true;
      continue;
    }
    if (cell.scope === 'none') continue;
    best = Math.max(best, ladder.indexOf(cell.scope));
  }
  const widest = ladder[best];
  return { scope: widest ?? 'none', includesAssigned, through };
}
