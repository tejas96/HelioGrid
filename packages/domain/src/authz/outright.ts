import type { Capability } from './capabilities';
import { can, limitsOn } from './policy';
import type { RolePreset } from './roles';

/**
 * Held with no limit on it: the door to a write. A limited cell — Finance's "view prices &
 * margins" on the catalog — opens the reads and never the writes, so every write and every
 * act a screen offers asks this, never `can` alone.
 */
export function holdsOutright(roles: readonly RolePreset[], capability: Capability): boolean {
  return can(roles, capability) && limitsOn(roles, capability).length === 0;
}
