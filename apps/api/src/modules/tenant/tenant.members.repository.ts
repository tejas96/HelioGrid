import { membershipRole, type TenantScopedDb, tenantMembership, userAccount } from '@heliogrid/db';
import type { MembershipStatus, RolePreset } from '@heliogrid/domain';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * The roster's row and how it is read — one shape for the roster page and for the row a guarded
 * transition answers with, so the two cannot drift.
 */

export interface MemberRow {
  readonly membershipId: string;
  readonly userId: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly status: MembershipStatus;
  readonly lastActiveAt: Date | null;
}

/** The roster's columns, joined to the account under its own policy. */
export function memberQuery(tx: TenantScopedDb) {
  return tx
    .select({
      membershipId: tenantMembership.id,
      userId: userAccount.id,
      name: userAccount.name,
      phoneE164: userAccount.phoneE164,
      status: tenantMembership.status,
      lastActiveAt: tenantMembership.lastActiveAt,
    })
    .from(tenantMembership)
    .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId));
}

/** Every preset each row's membership holds, in one read over the membership index. */
export async function withRoles(
  tx: TenantScopedDb,
  tenantId: string,
  rows: readonly Omit<MemberRow, 'roles'>[],
): Promise<MemberRow[]> {
  const ids = rows.map((row) => row.membershipId);
  const held =
    ids.length === 0
      ? []
      : await tx
          .select({
            membershipId: membershipRole.membershipId,
            rolePreset: membershipRole.rolePreset,
          })
          .from(membershipRole)
          .where(
            and(eq(membershipRole.tenantId, tenantId), inArray(membershipRole.membershipId, ids)),
          )
          // The enum's declaration order IS the matrix order (`F2-25`), so chips render as F2 lists them.
          .orderBy(membershipRole.rolePreset);
  return rows.map((row) => ({
    ...row,
    roles: held.filter((r) => r.membershipId === row.membershipId).map((r) => r.rolePreset),
  }));
}
