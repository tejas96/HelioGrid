import type { LadderScope, VisibilityCell, VisibilityDomain, VisibilityRow } from './cells';
import { CRM_VISIBILITY } from './crm';
import { FIELD_VISIBILITY } from './field';
import { HR_VISIBILITY } from './hr';
import { MARKETING_VISIBILITY } from './marketing';
import { PROJECTS_VISIBILITY } from './projects';
import type { RolePreset } from './roles';

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
  /** The held presets whose cell IS the winning rung — "which role is doing the work" (F2-13). */
  readonly grantedBy: readonly RolePreset[];
}

export const NO_VISIBILITY: ResolvedVisibility = {
  scope: 'none',
  includesAssigned: false,
  through: [],
  grantedBy: [],
};

/** One held preset's cell in the domain being resolved. */
export type HeldCell = readonly [RolePreset, VisibilityCell];

interface Fold {
  includesAssigned: boolean;
  /** Keyed by domain and rung, so two presets reaching through the same rung count once. */
  readonly through: Map<string, ReachedThrough>;
  readonly rungOf: Map<RolePreset, LadderScope>;
}

/** One preset's cell into the fold: a through-cell is carried, `assigned` is noted, a rung is ranked. */
function foldCell(
  fold: Fold,
  preset: RolePreset,
  cell: VisibilityCell,
  ladder: readonly LadderScope[],
): void {
  if (cell.through !== undefined) {
    fold.through.set(`${cell.through}:${cell.scope}`, { domain: cell.through, scope: cell.scope });
    return;
  }
  if (cell.scope === 'assigned') {
    fold.includesAssigned = true;
    return;
  }
  if (cell.scope === 'none' || !ladder.includes(cell.scope)) return;
  fold.rungOf.set(preset, cell.scope);
}

/**
 * Widest wins on the domain's ladder (F2-13); `assigned` is noted beside it, `none` never wins,
 * a cell that reads through another domain is carried out whole for the caller to join, and the
 * presets whose cell is the winning rung are named in the order they were given — `visibilityIn`
 * gives them in matrix order, once each (F2-15: the answer is a function of the SET of presets).
 */
export function resolveVisibility(
  held: readonly HeldCell[],
  ladder: readonly LadderScope[],
): ResolvedVisibility {
  const fold: Fold = { includesAssigned: false, through: new Map(), rungOf: new Map() };
  for (const [preset, cell] of held) foldCell(fold, preset, cell, ladder);
  const widest = [...fold.rungOf.values()].reduce<LadderScope | undefined>(
    (best, rung) =>
      best === undefined || ladder.indexOf(rung) > ladder.indexOf(best) ? rung : best,
    undefined,
  );
  const { includesAssigned } = fold;
  const through = [...fold.through.values()];
  if (widest === undefined) return { scope: 'none', includesAssigned, through, grantedBy: [] };
  const grantedBy = [...fold.rungOf]
    .filter(([, rung]) => rung === widest)
    .map(([preset]) => preset);
  return { scope: widest, includesAssigned, through, grantedBy };
}
