import type { RolePreset } from '@heliogrid/contracts';
import { homeFor } from '@heliogrid/domain';
import type { SessionUser } from './types';

/** A signed-in person belongs inside only with a company; without one they belong on the company step (`M01-10`). */
export function hasCompany(user: SessionUser | null): boolean {
  return user !== null && user.tenant !== null;
}

/** The home a signed-in person is taken to, or null while they have no company. */
export function homeOf(user: SessionUser | null): RolePreset | null {
  return user !== null && user.tenant !== null ? homeFor(user.tenant.roles) : null;
}
