import {
  type Db,
  membershipRole,
  tenant,
  tenantMembership,
  userAccount,
  withTenantTransaction,
} from '@heliogrid/db';
import type { MembershipStatus, RolePreset } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { RUNTIME_DB } from '../../common/db/runtime.token';
import { type TenantRow, tenantColumns } from './tenant.admin.repository';

export interface MemberRow {
  readonly membershipId: string;
  readonly userId: string;
  readonly name: string | null;
  readonly phoneE164: string;
  readonly roles: readonly RolePreset[];
  readonly status: MembershipStatus;
  readonly lastActiveAt: Date | null;
}

/**
 * The tenant-facing reads, on the runtime pool inside the tenant transaction: the tenant's own
 * row through its policy, and the roster through the membership policy — which is also what
 * lets `user_account` rows show for members and nobody else.
 */
@Injectable()
export class TenantRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  async me(tenantId: string): Promise<TenantRow | null> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [row] = await tx
        .select(tenantColumns())
        .from(tenant)
        .where(eq(tenant.id, tenantId))
        .limit(1);
      return row ?? null;
    });
  }

  /** The roster page, most recently active first; the count runs over the SAME where. */
  async members(
    tenantId: string,
    page: { limit: number; offset: number },
  ): Promise<{ items: MemberRow[]; totalCount: number }> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const where = eq(tenantMembership.tenantId, tenantId);
      const rows = await tx
        .select({
          membershipId: tenantMembership.id,
          userId: userAccount.id,
          name: userAccount.name,
          phoneE164: userAccount.phoneE164,
          status: tenantMembership.status,
          lastActiveAt: tenantMembership.lastActiveAt,
        })
        .from(tenantMembership)
        .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
        .where(where)
        .orderBy(sql`${tenantMembership.lastActiveAt} desc nulls last`, desc(tenantMembership.id))
        .limit(page.limit)
        .offset(page.offset);
      const ids = rows.map((row) => row.membershipId);
      const roles =
        ids.length === 0
          ? []
          : await tx
              .select({
                membershipId: membershipRole.membershipId,
                rolePreset: membershipRole.rolePreset,
              })
              .from(membershipRole)
              .where(
                and(
                  eq(membershipRole.tenantId, tenantId),
                  inArray(membershipRole.membershipId, ids),
                ),
              );
      const [total] = await tx.select({ n: count() }).from(tenantMembership).where(where);
      return {
        items: rows.map((row) => ({
          ...row,
          roles: roles.filter((r) => r.membershipId === row.membershipId).map((r) => r.rolePreset),
        })),
        totalCount: total?.n ?? 0,
      };
    });
  }
}
