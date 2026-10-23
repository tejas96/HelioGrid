import { membershipRole, type TenantPool, tenantMembership, userAccount } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/**
 * The company's active EPC Owners by name (`SCR-M01-10` ruling 15), for any member: names only,
 * never a phone. One index-backed read (`membership_role_tenant_preset_idx`); the window count
 * runs over the same `where` before the limit, so the total can never drift from the names.
 */
@Injectable()
export class TenantOwnersRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async owners(
    tenantId: string,
    shown: number,
  ): Promise<{ readonly names: readonly string[]; readonly total: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await tx
        .select({ name: userAccount.name, total: sql<number>`count(*) over ()`.mapWith(Number) })
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
            eq(membershipRole.rolePreset, FOUNDER_ROLE),
            eq(tenantMembership.status, 'active'),
            isNotNull(userAccount.name),
          ),
        )
        .orderBy(asc(userAccount.name), asc(tenantMembership.id))
        .limit(shown);
      return {
        names: rows.flatMap((row) => (row.name === null ? [] : [row.name])),
        total: rows[0]?.total ?? 0,
      };
    });
  }
}
