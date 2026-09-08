import { type Db, membershipRole, tenant, tenantMembership, userAccount } from '@heliogrid/db';
import type { UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

export interface TenantRow {
  readonly id: string;
  readonly companyName: string;
  readonly city: string;
  readonly marketCode: string;
  readonly currencyCode: string;
  readonly defaultLanguage: UiLanguage;
  readonly timezone: string;
  readonly segment: 'residential' | 'ci' | 'both' | null;
  readonly typicalSystemKwp: string | null;
}

/**
 * The two writes that cross tenancy by nature, so they ride the admin pool: company signup —
 * the tenant, the owner membership and the owner role in ONE transaction, so the signer is EPC
 * Owner from the first moment (`M01-01`, `F2-19`) — and the likely-existing-workspace read a
 * signup steers on before it has a tenant to be scoped by (`M01-09`).
 */
@Injectable()
export class TenantAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async createWithOwner(input: {
    companyName: string;
    city: string;
    marketCode: string;
    currencyCode: string;
    defaultLanguage: UiLanguage;
    timezone: string;
    ownerUserId: string;
    ownerName: string;
    now: number;
  }): Promise<TenantRow> {
    const now = new Date(input.now);
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tenant)
        .values({
          companyName: input.companyName,
          city: input.city,
          marketCode: input.marketCode,
          currencyCode: input.currencyCode,
          defaultLanguage: input.defaultLanguage,
          timezone: input.timezone,
          createdAt: now,
        })
        .returning(tenantColumns());
      if (!created) throw new Error('tenant insert returned no row');
      const [membership] = await tx
        .insert(tenantMembership)
        .values({
          tenantId: created.id,
          userAccountId: input.ownerUserId,
          status: 'active',
          lastActiveAt: now,
          coachMarksDismissed: 0,
          authorizationVersion: 0,
          createdAt: now,
        })
        .returning({ id: tenantMembership.id });
      if (!membership) throw new Error('tenant_membership insert returned no row');
      await tx
        .insert(membershipRole)
        .values({ tenantId: created.id, membershipId: membership.id, rolePreset: 'epc_owner' });
      // The signer's name is a signup fact (`M01-01`); it lands on the account with the company.
      await tx
        .update(userAccount)
        .set({ name: input.ownerName })
        .where(eq(userAccount.id, input.ownerUserId));
      return created;
    });
  }

  /** Workspaces with this exact company name and city — the request-to-join steer (`M01-09`). */
  async similar(companyName: string, city: string): Promise<TenantRow[]> {
    return this.db
      .select(tenantColumns())
      .from(tenant)
      .where(
        and(
          eq(sql`lower(${tenant.companyName})`, sql`lower(${companyName})`),
          eq(sql`lower(${tenant.city})`, sql`lower(${city})`),
        ),
      );
  }
}

export function tenantColumns() {
  return {
    id: tenant.id,
    companyName: tenant.companyName,
    city: tenant.city,
    marketCode: tenant.marketCode,
    currencyCode: tenant.currencyCode,
    defaultLanguage: tenant.defaultLanguage,
    timezone: tenant.timezone,
    segment: tenant.segment,
    typicalSystemKwp: tenant.typicalSystemKwp,
  };
}
