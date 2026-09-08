import { CAPABILITY_MATRIX, type Capability } from './capabilities';
import type { VisibilityDomain } from './cells';
import type { RolePreset } from './roles';
import {
  DOMAIN_LADDERS,
  NO_VISIBILITY,
  type ResolvedVisibility,
  resolveVisibility,
  VISIBILITY_MATRIX,
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
 * The widest scope the held presets carry in ONE domain (F2-13, F2-14): the domain's row in
 * `VISIBILITY_MATRIX`, folded over the domain's own ladder. A domain with no fixed row yet
 * resolves to `none` — fail-closed, and the correct answer before that module exists.
 */
export function visibilityIn(
  roles: readonly RolePreset[],
  domain: VisibilityDomain,
): ResolvedVisibility {
  const row = VISIBILITY_MATRIX[domain];
  if (!row) return NO_VISIBILITY;
  return resolveVisibility(
    roles.map((role) => row.cells[role]),
    DOMAIN_LADDERS[domain],
  );
}
