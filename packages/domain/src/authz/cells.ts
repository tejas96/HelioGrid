import type { RolePreset } from './roles';

/**
 * The cell vocabulary of `docs/prd/foundations/F2-roles-and-permissions.md` §F2.5 — what ONE
 * preset holds in ONE row. The PRD writes four forms: `✓` held · `—` not held · `✓ (phrase)`
 * or a bare phrase, a scoped grant whose phrase is carried verbatim. This is the leaf every
 * module file imports; it knows no row.
 */
export type CapabilityGrant =
  | { readonly held: false }
  | { readonly held: true }
  | { readonly held: true; readonly limitedTo: string };

export const DENIED: CapabilityGrant = { held: false };
export const GRANTED: CapabilityGrant = { held: true };

/**
 * A phrase in a cell is a NARROWER ACT, not one of the visibility scopes. A boolean guard
 * cannot enforce a sentence, so the grant is held and the phrase travels with it for the owning
 * slice to enforce — never silently dropped, never silently widened.
 */
export const limited = (limitedTo: string): CapabilityGrant => ({ held: true, limitedTo });

/**
 * The row-key convention F2-25 fixes: `F2.M<nn>.<slug>`, and `F2.F5.<slug>` for the customer-link
 * surfaces. Every row carries its key so a reader finds the binding cell in the PRD rather than
 * trusting this code. Where the two could ever be read differently, the CELL wins.
 */
export type CapabilityRowKey = `F2.${'M' | 'F'}${string}.${string}`;

export interface CapabilityRow {
  readonly rowKey: CapabilityRowKey;
  /**
   * `Record<RolePreset, …>` is the mechanism, not decoration: a thirteenth preset fails to
   * compile until every row states its cell. There is no default — an unstated cell is exactly
   * how a permission silently appears.
   */
  readonly grants: Readonly<Record<RolePreset, CapabilityGrant>>;
}

/** The scope domains F2-14 names. Visibility resolves inside each and never leaks across. */
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
 * The rungs a domain's ladder is built from (`DOMAIN_LADDERS` in `visibility.ts`). `assigned`
 * sits beside `own` for the assigned-only presets and never wins a ladder comparison; `none` is
 * the `—` cell.
 */
export type LadderScope = 'own' | 'team' | 'portfolio' | 'all';
export type VisibilityScope = LadderScope | 'assigned' | 'none';

/**
 * One preset's cell in a visibility row. The scope word is the grant; anything after it is the
 * qualifier, verbatim. A cell with no scope word reads as `all`, qualified by the whole phrase:
 * a qualifier narrows the ACT, not the set.
 *
 * A cell can read THROUGH another domain's rung: "Own projects' deals (read)" in the leads row is
 * the leads a person reaches through their OWN PROJECTS, and "Portfolio deals (read)" the leads
 * reached through the projects portfolio — `portfolio` is a rung of the projects ladder, not the
 * leads one. Such a cell names `through`, so a fold over this domain's ladder never mistakes it
 * for a rung it does not have, and never drops it.
 */
export interface OwnDomainCell {
  readonly scope: VisibilityScope;
  readonly qualifier?: string;
  readonly through?: undefined;
}

/** A through-cell always names a rung of the other domain's ladder — never `assigned`, never `none`. */
export interface ThroughCell {
  readonly scope: LadderScope;
  readonly qualifier: string;
  readonly through: VisibilityDomain;
}

export type VisibilityCell = OwnDomainCell | ThroughCell;

export const none: VisibilityCell = { scope: 'none' };
export const scope = (word: VisibilityScope, qualifier?: string): VisibilityCell =>
  qualifier === undefined ? { scope: word } : { scope: word, qualifier };
export const through = (
  domain: VisibilityDomain,
  word: LadderScope,
  qualifier: string,
): VisibilityCell => ({ scope: word, qualifier, through: domain });

export interface VisibilityRow {
  readonly rowKey: CapabilityRowKey;
  readonly cells: Readonly<Record<RolePreset, VisibilityCell>>;
}
