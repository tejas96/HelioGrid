import type { MemberRef } from '@heliogrid/contracts';
import { type DbTransaction, membershipRole, tenantMembership, userAccount } from '@heliogrid/db';
import { type Capability, can, ROLE_PRESETS, type RolePreset } from '@heliogrid/domain';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { memberNameOf } from './crm.lead-columns.repository';

/** An active member of the company as a task or a visit names them, with what they hold. */
export interface ActiveMember {
  readonly userId: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
}

/**
 * The person as an ACTIVE member of this company — `null` for a deactivated one, someone in another
 * company or no one: a task or a visit is never handed to a person who cannot open it.
 */
export async function activeMemberOf(
  tx: DbTransaction,
  tenantId: string,
  userId: string,
): Promise<ActiveMember | null> {
  const rows = await tx
    .select({
      name: userAccount.name,
      phoneE164: userAccount.phoneE164,
      role: membershipRole.rolePreset,
    })
    .from(membershipRole)
    .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(
      and(
        eq(membershipRole.tenantId, tenantId),
        eq(tenantMembership.userAccountId, userId),
        eq(tenantMembership.status, 'active'),
      ),
    );
  const [first] = rows;
  if (first === undefined) return null;
  return {
    userId,
    name: first.name,
    phoneE164: first.phoneE164,
    roles: rows.map((row) => row.role),
  };
}

/** An account joined in full always has a number, so its name never reads null here. */
export const memberName = sql<string>`${memberNameOf(userAccount)}`;

/**
 * The company's ACTIVE members whose roles grant `capability` — a deactivated member is never
 * offered — by name; just the one named when `onlyUserId` is given. A list a picker shows
 * and the check its write makes read this one query, so the two cannot disagree.
 */
export async function activeMembersHolding(
  tx: DbTransaction,
  tenantId: string,
  capability: Capability,
  onlyUserId?: string,
): Promise<MemberRef[]> {
  const granting = ROLE_PRESETS.filter((preset) => can([preset], capability));
  return tx
    .select({ userId: userAccount.id, name: memberName })
    .from(membershipRole)
    .innerJoin(
      tenantMembership,
      and(
        eq(tenantMembership.id, membershipRole.membershipId),
        eq(tenantMembership.tenantId, membershipRole.tenantId),
      ),
    )
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
    .where(
      and(
        eq(membershipRole.tenantId, tenantId),
        eq(tenantMembership.status, 'active'),
        inArray(membershipRole.rolePreset, granting),
        onlyUserId === undefined ? undefined : eq(userAccount.id, onlyUserId),
      ),
    )
    .groupBy(userAccount.id)
    .orderBy(memberName, userAccount.id);
}
