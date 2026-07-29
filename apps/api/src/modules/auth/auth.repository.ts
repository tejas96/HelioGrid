import type { RolePreset, UiLanguage, UnitsPref } from '@heliogrid/contracts';
import { type Db, schema, withTenantTransaction } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { RUNTIME_DB } from '../../common/db/runtime.token';

const { invites, tenants, userRoles, users } = schema;

/**
 * TENANT-SCOPED data access for auth/tenancy. Every method runs inside
 * `withTenantTransaction`, which issues `SET LOCAL app.tenant_id` so RLS is live on each
 * statement — the service never sees a `tx`, a table object, or SQL.
 *
 * This file is one of the only places allowed to import `@heliogrid/db` and `drizzle-orm`
 * (dependency-cruiser `db-access-in-repositories-only`). That fence is what turns "every
 * query path is tenant-scoped" from a promise into a lint result.
 */
@Injectable()
export class AuthRepository {
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  /** The single choke point: no public method may touch the db outside this wrapper. */
  private scoped<T>(tenantId: string, work: Parameters<typeof withTenantTransaction<T>>[2]) {
    return withTenantTransaction(this.db, tenantId, work);
  }

  async findProfileAndTenant(userId: string, tenantId: string) {
    return this.scoped(tenantId, async (tx) => {
      const [profile] = await tx.select().from(users).where(eq(users.id, userId));
      const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, tenantId));
      if (!profile || !tenant) return null;
      return { profile, tenant };
    });
  }

  async updateProfile(
    userId: string,
    tenantId: string,
    patch: { name?: string; language?: UiLanguage; unitsPref?: UnitsPref },
  ) {
    await this.scoped(tenantId, async (tx) => {
      await tx.update(users).set(patch).where(eq(users.id, userId));
    });
  }

  async listMembersWithRoles(tenantId: string) {
    return this.scoped(tenantId, async (tx) => {
      const members = await tx.select().from(users).where(eq(users.tenantId, tenantId));
      const roleRows = await tx.select().from(userRoles).where(eq(userRoles.tenantId, tenantId));
      return members.map((m) => ({
        userId: m.id,
        name: m.name,
        phoneE164: m.phoneE164,
        status: m.status,
        roles: roleRows.filter((r) => r.userId === m.id).map((r) => r.role),
      }));
    });
  }

  /**
   * Replace a member's roles, refusing to remove the LAST owner (D27).
   *
   * The invariant is checked here, inside the transaction, on purpose: read-then-write
   * across a service/repository boundary would leave a race where two concurrent
   * demotions each see two owners and both succeed. When `packages/domain` lands, the
   * PREDICATE moves there and this method calls it — the atomicity stays here regardless.
   */
  async replaceMemberRoles(tenantId: string, targetUserId: string, roles: RolePreset[]) {
    return this.scoped(tenantId, async (tx) => {
      const ownerRows = await tx
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.tenantId, tenantId), eq(userRoles.role, 'owner')));
      const losesOwner =
        ownerRows.some((r) => r.userId === targetUserId) && !roles.includes('owner');
      if (losesOwner && ownerRows.length === 1) return 'LAST_OWNER' as const;

      await tx
        .delete(userRoles)
        .where(and(eq(userRoles.tenantId, tenantId), eq(userRoles.userId, targetUserId)));
      await tx
        .insert(userRoles)
        .values(roles.map((role) => ({ tenantId, userId: targetUserId, role })));
      return { userId: targetUserId, roles };
    });
  }

  async insertInvite(input: {
    tenantId: string;
    phoneE164: string;
    roles: RolePreset[];
    invitedBy: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.scoped(input.tenantId, async (tx) => {
      const [row] = await tx.insert(invites).values(input).returning();
      if (!row) throw new Error('invite insert failed');
      return row;
    });
  }

  async listInvites(tenantId: string, limit: number) {
    return this.scoped(tenantId, (tx) =>
      tx.select().from(invites).where(eq(invites.tenantId, tenantId)).limit(limit),
    );
  }

  /** Returns null when the invite does not exist or is no longer pending. */
  async revokePendingInvite(tenantId: string, inviteId: string) {
    return this.scoped(tenantId, async (tx) => {
      const [row] = await tx
        .update(invites)
        .set({ status: 'revoked' })
        .where(and(eq(invites.id, inviteId), inArray(invites.status, ['pending'])))
        .returning();
      return row ?? null;
    });
  }
}
