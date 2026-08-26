/**
 * Visibility scope — F2-12 (the D20 law), F2-13 (widest wins) and F2-14 (per domain).
 *
 * "Reps see only their own leads. Managers see the team's, owner sees everything." Every
 * list, board, report and dashboard is THE SAME SURFACE, scoped — never a different surface
 * per role.
 *
 * A scope is a REPOSITORY POLICY INPUT, not a permission: the guard answers "may they act",
 * the repository answers "over which rows". Keeping them apart is what stops visibility
 * becoming a per-row permission system, which F2 §5 rules out absolutely.
 */

/**
 * Ordered WIDEST-LAST. The order IS the comparison — `widestScope` indexes this tuple, so a
 * new scope must be inserted at its true rank, not appended.
 *
 * `assigned` sits BESIDE `own`, not above it (F2-14): a Survey Engineer sees the leads
 * assigned to them, which is neither a subset nor a superset of "the ones they created".
 * They are unioned rather than ranked — see `resolveVisibility`.
 */
export const VISIBILITY_LADDER = ['own', 'team', 'all'] as const;
export type LadderScope = (typeof VISIBILITY_LADDER)[number];

/** Every scope a matrix cell can carry. */
export type VisibilityScope = LadderScope | 'assigned' | 'none';

/**
 * The domains visibility resolves in, INDEPENDENTLY (F2-14). Holding a wide scope in one
 * never widens another: a Sales Manager + Field Technician sees the team's leads and only
 * their own route.
 *
 * Named here rather than in each module because the independence is the law; a module adding
 * a domain is amending this list, which is the point at which someone must ask whether it
 * really is a new domain.
 */
export const VISIBILITY_DOMAINS = [
  'leads',
  'projects',
  'field_work',
  'people',
  'money',
  'campaigns',
] as const;
export type VisibilityDomain = (typeof VISIBILITY_DOMAINS)[number];

/**
 * What a caller gets: the widest LADDER scope any held role grants, plus whether any held
 * role grants `assigned`. Both, because they are not comparable — a person holding Sales
 * Executive (own) and Survey Engineer (assigned) sees their own leads AND the ones assigned
 * to them, and collapsing that to one word loses half the rows.
 */
export interface ResolvedVisibility {
  scope: LadderScope | 'none';
  includesAssigned: boolean;
}

export const NO_VISIBILITY: ResolvedVisibility = {
  scope: 'none',
  includesAssigned: false,
};

function rank(scope: VisibilityScope): number {
  const index = VISIBILITY_LADDER.indexOf(scope as LadderScope);
  return index; // -1 for 'assigned' and 'none', which never win the ladder comparison
}

/**
 * Widest wins, within one domain (F2-13). `assigned` is unioned, never ranked.
 * Order-independent by construction: it is a fold over a total order, so the same set of
 * scopes gives the same answer whatever order the roles arrive in.
 */
export function resolveVisibility(scopes: readonly VisibilityScope[]): ResolvedVisibility {
  let best = -1;
  let includesAssigned = false;
  for (const scope of scopes) {
    if (scope === 'assigned') includesAssigned = true;
    best = Math.max(best, rank(scope));
  }
  const widest = VISIBILITY_LADDER[best];
  return { scope: widest ?? 'none', includesAssigned };
}
