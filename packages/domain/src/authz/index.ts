/**
 * Authorization policy — pure, and deliberately the bottom layer.
 *
 * It knows nothing about Better Auth, sessions, tenants or HTTP. The API resolves the current
 * membership's roles and asks; this answers. `docs/engineering/forward-compat.md` (auth/tenancy
 * row) requires ONE deny-by-default guard over exactly this, so that a new role is never a
 * repo-wide sweep of `if role === …`.
 */
export type {
  Capability,
  CapabilityGrant,
  CapabilityRow,
} from './capabilities';
export { CAPABILITY_MATRIX, M01_CAPABILITIES } from './capabilities';
export {
  can,
  capabilityLimit,
  grantedCapabilities,
  visibilityIn,
} from './policy';
export type { CapabilityRowKey, RolePreset } from './roles';
export { ROLE_PRESETS } from './roles';
export type {
  LadderScope,
  ResolvedVisibility,
  VisibilityDomain,
  VisibilityScope,
} from './visibility';
export {
  resolveVisibility,
  VISIBILITY_DOMAINS,
  VISIBILITY_LADDER,
} from './visibility';
