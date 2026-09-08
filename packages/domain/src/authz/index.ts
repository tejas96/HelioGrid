/**
 * Authorization policy — pure, and deliberately the bottom layer.
 *
 * It knows nothing about the identity library, sessions, tenants or HTTP. The API resolves
 * the current membership's roles and asks; this answers. `T-M01-025` (docs/tasks/M01-onboarding.md)
 * requires ONE deny-by-default guard over exactly this, so that a new role is never a
 * repo-wide sweep of `if role === …`.
 */
export type { Capability } from './capabilities';
export { CAPABILITY_MATRIX } from './capabilities';
export type {
  CapabilityGrant,
  CapabilityRow,
  CapabilityRowKey,
  LadderScope,
  VisibilityCell,
  VisibilityDomain,
  VisibilityRow,
  VisibilityScope,
} from './cells';
export { VISIBILITY_DOMAINS } from './cells';
export { can, grantedCapabilities, limitsOn, visibilityIn } from './policy';
export type { RolePreset } from './roles';
export { FOUNDER_ROLE, ROLE_PRESETS } from './roles';
export type { HeldCell, ReachedThrough, ResolvedVisibility } from './visibility';
export { DOMAIN_LADDERS, resolveVisibility, VISIBILITY_MATRIX } from './visibility';
