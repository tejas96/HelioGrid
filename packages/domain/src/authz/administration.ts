import type { MembershipStatus } from '../tenancy/membership';
import { can } from './policy';
import { FOUNDER_ROLE, type RolePreset } from './roles';

/**
 * F2 §F2.3 — the guard rails that keep a company from locking itself out (F2-19).
 *
 * `heldByActiveMembers` is every preset an ACTIVE member holds, all members together, as the
 * presets would stand AFTER the change being judged; a transition passes the others' presets
 * plus the subject's new ones, a deactivation the others' alone. Both clauses of F2-19 are
 * asked: someone is EPC Owner, and someone's presets grant Manage team — the second of the
 * matrix through `can`, never of a preset name, so a matrix that one day grants Manage team
 * more widely changes nothing here.
 */
export function keepsControl(heldByActiveMembers: readonly RolePreset[]): boolean {
  return (
    heldByActiveMembers.includes(FOUNDER_ROLE) && can(heldByActiveMembers, 'onboarding.manage_team')
  );
}

/**
 * Role administration acts on an ACTIVE membership only (F2-20): a deactivated person keeps
 * their presets as history, and an invited one has not joined yet.
 */
export function acceptsAdministration(status: MembershipStatus): boolean {
  return status === 'active';
}
