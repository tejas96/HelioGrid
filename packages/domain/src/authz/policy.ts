import { CAPABILITY_MATRIX, type Capability } from './capabilities';
import type { RolePreset } from './roles';
import {
  NO_VISIBILITY,
  type ResolvedVisibility,
  resolveVisibility,
  type VisibilityDomain,
  type VisibilityScope,
} from './visibility';

/**
 * The whole permission model, as three pure functions over a person's held presets.
 *
 * `docs/prd/foundations/F2-roles-and-permissions.md` §F2.2 states how the laws compose, and
 * this file is that paragraph in code, in the same order:
 *   1. collect the person's presets (F2-10 — stacking IS the design);
 *   2. a capability is granted if ANY preset's cell grants it (F2-11 — OR, no AND, no
 *      precedence, no negative grant; a preset can only add);
 *   3. a visibility scope is, per domain, the widest any preset grants (F2-13, F2-14).
 *
 * Nothing else participates. No per-person flag (F2-15: "to know what someone can do, you
 * look at their roles — one source of truth"), no tenant-shaped role (F2-16), no object- or
 * field-level rule (§5). That is what keeps "what can this person do?" a one-line answer.
 *
 * PURE on purpose: no clock, no database, no session. The API resolves the current
 * membership and passes the roles in; this decides. That separation is what lets the
 * invariant layer prove the matrix without a server, and what stops a permission check
 * quietly becoming a query.
 */

/** OR across held roles (F2-11). Zero roles can never grant anything — an invitee with no role is blocked (F2-21). */
export function can(roles: readonly RolePreset[], capability: Capability): boolean {
  const { grants } = CAPABILITY_MATRIX[capability];
  return roles.some((role) => grants[role].held);
}

/**
 * The limit phrase, when the ONLY way a person holds a capability is a limited cell.
 *
 * Returns `undefined` when they hold it outright — a person who is both Finance and
 * Operations manages the catalog fully, because OR takes the wider grant. Returning the limit
 * anyway would narrow a grant the matrix gives, which F2-11 forbids ("a preset can only add").
 */
export function capabilityLimit(
  roles: readonly RolePreset[],
  capability: Capability,
): string | undefined {
  const { grants } = CAPABILITY_MATRIX[capability];
  const held = roles.map((role) => grants[role]).filter((grant) => grant.held);
  if (held.length === 0) return undefined;
  if (held.some((grant) => !('limitedTo' in grant))) return undefined;
  const first = held[0];
  return first && 'limitedTo' in first ? first.limitedTo : undefined;
}

/** Every capability the held roles grant, in matrix order — the "Rajesh can sell, survey and design" line's input. */
export function grantedCapabilities(roles: readonly RolePreset[]): Capability[] {
  return (Object.keys(CAPABILITY_MATRIX) as Capability[]).filter((c) => can(roles, c));
}

/**
 * Per-domain visibility scopes a preset carries. Each module appends its domain's cells when
 * its slice begins; a domain no preset has landed cells for resolves to `none`, which is
 * fail-closed and is the correct answer before that module exists.
 *
 * M01 owns no visibility domain: its rows are all acts. The table is here, empty, because the
 * SHAPE is the thing later modules must fill — F2-14's independence is a property of this
 * table being per-domain, and discovering that after three modules have each invented their
 * own is the sweep the forward-compat register exists to prevent.
 *
 * Not exported: `visibilityIn` is the only way to read it, so no caller can index it directly
 * and skip the widest-wins fold. A module fills it by editing here, beside the function that
 * enforces the law on it.
 */
const VISIBILITY_MATRIX: Readonly<
  Partial<Record<VisibilityDomain, Readonly<Partial<Record<RolePreset, VisibilityScope>>>>>
> = {};

/**
 * Widest wins, inside ONE domain (F2-13, F2-14). Holding `all` in `leads` never widens
 * `field_work` — a Sales Manager + Field Technician sees the team's leads and only their own
 * route, and that sentence is this function's whole contract.
 */
export function visibilityIn(
  roles: readonly RolePreset[],
  domain: VisibilityDomain,
): ResolvedVisibility {
  const cells = VISIBILITY_MATRIX[domain];
  if (!cells) return NO_VISIBILITY;
  const scopes = roles.map((role) => cells[role]).filter((s): s is VisibilityScope => Boolean(s));
  return resolveVisibility(scopes);
}
