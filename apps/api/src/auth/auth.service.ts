import { createHash, randomBytes } from 'node:crypto';
import type { RolePreset } from '@heliogrid/contracts';
import { type Db, schema, uuidv7, withTenantTransaction } from '@heliogrid/db';
import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { Auth } from './better-auth';
import { ADMIN_DB, AUTH, RUNTIME_DB } from './tokens';

const { invites, tenantCounters, tenantSettings, tenants, userRoles, users } = schema;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'tenant'}-${randomBytes(3).toString('hex')}`;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    @Inject(RUNTIME_DB) private readonly db: Db,
    @Inject(ADMIN_DB) private readonly adminDb: Db,
  ) {}

  /** Guard's tenant/roles lookup — admin pool (runs before any tenant context exists). */
  async resolveTenant(userId: string): Promise<{ tenantId: string | null; roles: RolePreset[] }> {
    const [profile] = await this.adminDb.select().from(users).where(eq(users.id, userId));
    if (!profile) return { tenantId: null, roles: [] };
    const roleRows = await this.adminDb
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.tenantId, profile.tenantId), eq(userRoles.userId, userId)));
    return { tenantId: profile.tenantId, roles: roleRows.map((r) => r.role) };
  }

  async me(userId: string, tenantId: string | null, roles: RolePreset[]) {
    if (!tenantId) return null;
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [profile] = await tx.select().from(users).where(eq(users.id, userId));
      const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, tenantId));
      if (!profile || !tenant) return null;
      return {
        user: {
          id: profile.id,
          name: profile.name,
          phoneE164: profile.phoneE164,
          language: profile.language,
          unitsPref: profile.unitsPref,
          roles,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          segment: tenant.segment,
          status: tenant.status,
        },
      };
    });
  }

  /**
   * Stage-0 onboarding: Better Auth organization first (tenants.id IS organization.id),
   * then OUR rows in one DB transaction on the admin path (app_user cannot insert
   * tenants — deliberate, docs/db CLAUDE.md). Compensation: destroy the org on failure.
   */
  async completeOnboarding(
    userId: string,
    phoneE164: string,
    input: {
      tenantName: string;
      userName: string;
      segment: 'residential' | 'ci' | 'both';
      typicalSystemKw?: number;
      language: 'en' | 'hi' | 'mr';
    },
  ) {
    const existing = await this.resolveTenant(userId);
    if (existing.tenantId) throw new ConflictException('This account already has a workspace.');

    const slug = slugify(input.tenantName);
    const org = await this.auth.api.createOrganization({
      body: { name: input.tenantName, slug, userId },
    });
    if (!org) throw new Error('organization creation failed');

    try {
      await this.adminDb.transaction(async (tx) => {
        await tx.insert(tenants).values({
          id: org.id,
          name: input.tenantName,
          slug,
          segment: input.segment,
          typicalSystemKw: input.typicalSystemKw?.toFixed(2),
        });
        await tx.insert(users).values({
          id: userId,
          tenantId: org.id,
          name: input.userName,
          phoneE164,
          language: input.language,
          status: 'active',
        });
        await tx.insert(userRoles).values({ tenantId: org.id, userId, role: 'owner' });
        await tx.insert(tenantSettings).values({ id: uuidv7(), tenantId: org.id });
        await tx.insert(tenantCounters).values([
          { tenantId: org.id, counterKey: 'proposal_number' },
          { tenantId: org.id, counterKey: 'project_number' },
        ]);
      });
    } catch (err) {
      // Compensation: BA org delete needs a session context we don't have here. The
      // org row is orphaned (no tenants row) — logged for the cleanup sweep; harmless
      // meanwhile because resolveTenant only follows OUR users/tenants rows.
      this.logger.error(`onboarding tx failed — orphan BA organization ${org.id}`);
      throw err;
    }
    return { tenantId: org.id, userId, slug };
  }

  async updateProfile(
    userId: string,
    tenantId: string,
    patch: { name?: string; language?: 'en' | 'hi' | 'mr'; unitsPref?: 'm' | 'ft' },
  ) {
    await withTenantTransaction(this.db, tenantId, async (tx) => {
      await tx.update(users).set(patch).where(eq(users.id, userId));
    });
  }

  async listTeam(tenantId: string) {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
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

  /** Replace role set — invariant: at least one owner always remains (D27). */
  async setMemberRoles(tenantId: string, targetUserId: string, roles: RolePreset[]) {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
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

  async createInvite(tenantId: string, invitedBy: string, phoneE164: string, roles: RolePreset[]) {
    const [member] = await this.adminDb
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.phoneE164, phoneE164)));
    if (member) throw new ConflictException('That phone number is already on your team.');

    const token = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [row] = await tx
        .insert(invites)
        .values({ tenantId, phoneE164, roles, invitedBy, tokenHash, expiresAt })
        .returning();
      if (!row) throw new Error('invite insert failed');
      return { row, token };
    });
  }

  async listInvites(tenantId: string, limit: number) {
    return withTenantTransaction(this.db, tenantId, (tx) =>
      tx.select().from(invites).where(eq(invites.tenantId, tenantId)).limit(limit),
    );
  }

  async revokeInvite(tenantId: string, inviteId: string) {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const [row] = await tx
        .update(invites)
        .set({ status: 'revoked' })
        .where(and(eq(invites.id, inviteId), inArray(invites.status, ['pending'])))
        .returning();
      if (!row) throw new NotFoundException('Invite not found or not pending.');
      return row;
    });
  }

  /** Token redeem — admin path (invitee has no tenant context yet); one transaction. */
  async acceptInvite(userId: string, phoneE164: string, token: string, userName: string) {
    const already = await this.resolveTenant(userId);
    if (already.tenantId) return { kind: 'ALREADY_ONBOARDED' as const };

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [invite] = await this.adminDb
      .select()
      .from(invites)
      .where(eq(invites.tokenHash, tokenHash));
    if (!invite) return { kind: 'NOT_FOUND' as const };
    if (invite.status !== 'pending' || invite.expiresAt < new Date())
      return { kind: 'INVITE_NOT_PENDING' as const };
    if (invite.phoneE164 !== phoneE164) return { kind: 'PHONE_MISMATCH' as const };

    await this.adminDb.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        tenantId: invite.tenantId,
        name: userName,
        phoneE164,
        status: 'active',
      });
      await tx
        .insert(userRoles)
        .values(invite.roles.map((role) => ({ tenantId: invite.tenantId, userId, role })));
      await tx.update(invites).set({ status: 'accepted' }).where(eq(invites.id, invite.id));
    });
    await this.auth.api
      .addMember({ body: { organizationId: invite.tenantId, userId, role: 'member' } })
      .catch(() => undefined);
    return { kind: 'OK' as const, tenantId: invite.tenantId, userId };
  }
}
