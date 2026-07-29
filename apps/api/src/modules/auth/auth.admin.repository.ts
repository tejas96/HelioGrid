import type { RolePreset, TenantSegment, UiLanguage } from '@heliogrid/contracts';
import { type Db, schema, uuidv7 } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

const { invites, tenantCounters, tenantSettings, tenants, userRoles, users } = schema;

/**
 * CROSS-TENANT data access — the ONLY auth file allowed the elevated pool, and the reason
 * the `.admin.repository.ts` suffix exists (dependency-cruiser `admin-pool-fenced`).
 *
 * Every method here must be one a tenant-scoped query genuinely cannot serve:
 * - `resolveTenant` runs in the guard, BEFORE any tenant context exists;
 * - onboarding inserts the `tenants` row itself (app_user has no INSERT on tenants — see
 *   packages/db/CLAUDE.md, deliberately not granted);
 * - invite redemption looks a token up before the invitee belongs to any tenant.
 *
 * Adding a method here is a security decision, not a convenience. Prefer AuthRepository.
 */
@Injectable()
export class AuthAdminRepository {
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** Guard's tenant/roles lookup — runs before any tenant context exists. */
  async resolveTenant(userId: string): Promise<{ tenantId: string | null; roles: RolePreset[] }> {
    const [profile] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!profile) return { tenantId: null, roles: [] };
    const roleRows = await this.db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.tenantId, profile.tenantId), eq(userRoles.userId, userId)));
    return { tenantId: profile.tenantId, roles: roleRows.map((r) => r.role) };
  }

  async findMemberByPhone(tenantId: string, phoneE164: string) {
    const [member] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.phoneE164, phoneE164)));
    return member ?? null;
  }

  /** Stage-0: tenant + owner user + roles + settings + counters, in ONE transaction. */
  async createTenantWithOwner(input: {
    tenantId: string;
    userId: string;
    phoneE164: string;
    tenantName: string;
    userName: string;
    slug: string;
    segment: TenantSegment;
    typicalSystemKw?: number;
    language: UiLanguage;
  }) {
    await this.db.transaction(async (tx) => {
      await tx.insert(tenants).values({
        id: input.tenantId,
        name: input.tenantName,
        slug: input.slug,
        segment: input.segment,
        typicalSystemKw: input.typicalSystemKw?.toFixed(2),
      });
      await tx.insert(users).values({
        id: input.userId,
        tenantId: input.tenantId,
        name: input.userName,
        phoneE164: input.phoneE164,
        language: input.language,
        status: 'active',
      });
      await tx.insert(userRoles).values({
        tenantId: input.tenantId,
        userId: input.userId,
        role: 'owner',
      });
      await tx.insert(tenantSettings).values({ id: uuidv7(), tenantId: input.tenantId });
      await tx.insert(tenantCounters).values([
        { tenantId: input.tenantId, counterKey: 'proposal_number' },
        { tenantId: input.tenantId, counterKey: 'project_number' },
      ]);
    });
  }

  async findInviteByTokenHash(tokenHash: string) {
    const [invite] = await this.db.select().from(invites).where(eq(invites.tokenHash, tokenHash));
    return invite ?? null;
  }

  /** Invitee joins: users row + roles + invite marked accepted, in ONE transaction. */
  async redeemInvite(input: {
    inviteId: string;
    tenantId: string;
    userId: string;
    userName: string;
    phoneE164: string;
    roles: RolePreset[];
  }) {
    await this.db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: input.userId,
        tenantId: input.tenantId,
        name: input.userName,
        phoneE164: input.phoneE164,
        status: 'active',
      });
      await tx
        .insert(userRoles)
        .values(
          input.roles.map((role) => ({ tenantId: input.tenantId, userId: input.userId, role })),
        );
      await tx.update(invites).set({ status: 'accepted' }).where(eq(invites.id, input.inviteId));
    });
  }
}
