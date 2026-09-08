import { CAPABILITY_MATRIX, type Capability } from './capabilities';
import type { VisibilityDomain } from './cells';
import { ROLE_PRESETS, type RolePreset } from './roles';
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
 * The limit phrases, when the ONLY way a person holds a capability is through limited cells —
 * every distinct phrase, in matrix order, because two narrower acts compose to both of them.
 *
 * Empty when they hold it outright (a person who is both Finance and Operations manages the
 * catalog fully: OR takes the wider grant, and returning a limit would narrow a grant the
 * matrix gives, which F2-11 forbids) and empty when they do not hold it at all — `can` says
 * which.
 */
export function limitsOn(roles: readonly RolePreset[], capability: Capability): readonly string[] {
  const { grants } = CAPABILITY_MATRIX[capability];
  const held = heldPresets(roles)
    .map((role) => grants[role])
    .filter((grant) => grant.held);
  const phrases = held.flatMap((grant) => ('limitedTo' in grant ? [grant.limitedTo] : []));
  // Fewer phrases than held grants means one grant is outright, and outright wins.
  if (held.length === 0 || phrases.length < held.length) return [];
  return [...new Set(phrases)];
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
    heldPresets(roles).map((role) => [role, row.cells[role]] as const),
    DOMAIN_LADDERS[domain],
  );
}

/**
 * The SET of held presets, in matrix order (F2-25 fixes it): every answer here is a function of
 * the set alone (F2-15), so the order a caller assembled the roles in — a database row, a token
 * claim, a chip list — can never show through.
 */
function heldPresets(roles: readonly RolePreset[]): readonly RolePreset[] {
  return ROLE_PRESETS.filter((preset) => roles.includes(preset));
}
