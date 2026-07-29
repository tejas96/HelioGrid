import { createHash, randomBytes } from 'node:crypto';
import type { RolePreset, TenantSegment, UiLanguage, UnitsPref } from '@heliogrid/contracts';
import { HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import { AuthAdminRepository } from './auth.admin.repository';
import { AuthRepository } from './auth.repository';
import type { Auth } from './internal/better-auth';
import { AUTH } from './tokens';

/** 7 days — how long a phone invite stays redeemable. */
const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'tenant'}-${randomBytes(3).toString('hex')}`;
}

/**
 * Auth/tenancy behaviour. Deliberately contains NO SQL, no `tx`, and no table objects —
 * data access goes through the two repositories, which is what makes tenant scoping a
 * lint-enforced property rather than a per-method habit (CLAUDE.md §Structure).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    @Inject(AuthRepository) private readonly repo: AuthRepository,
    @Inject(AuthAdminRepository) private readonly adminRepo: AuthAdminRepository,
  ) {}

  /** Guard's tenant/roles lookup — admin path (runs before any tenant context exists). */
  resolveTenant(userId: string): Promise<{ tenantId: string | null; roles: RolePreset[] }> {
    return this.adminRepo.resolveTenant(userId);
  }

  async me(userId: string, tenantId: string | null, roles: RolePreset[]) {
    if (!tenantId) return null;
    const found = await this.repo.findProfileAndTenant(userId, tenantId);
    if (!found) return null;
    const { profile, tenant } = found;
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
  }

  /**
   * Stage-0 onboarding: Better Auth organization first (tenants.id IS organization.id),
   * then OUR rows in one transaction on the admin path (app_user cannot insert tenants —
   * deliberate, packages/db/CLAUDE.md). Compensation: log the orphan on failure.
   */
  async completeOnboarding(
    userId: string,
    phoneE164: string,
    input: {
      tenantName: string;
      userName: string;
      segment: TenantSegment;
      typicalSystemKw?: number;
      language: UiLanguage;
    },
  ) {
    const existing = await this.adminRepo.resolveTenant(userId);
    if (existing.tenantId)
      throw new ContractException(
        'ALREADY_ONBOARDED',
        'This account already has a workspace.',
        HttpStatus.CONFLICT,
      );

    const slug = slugify(input.tenantName);
    const org = await this.auth.api.createOrganization({
      body: { name: input.tenantName, slug, userId },
    });
    if (!org) throw new Error('organization creation failed');

    try {
      await this.adminRepo.createTenantWithOwner({
        tenantId: org.id,
        userId,
        phoneE164,
        tenantName: input.tenantName,
        userName: input.userName,
        slug,
        segment: input.segment,
        typicalSystemKw: input.typicalSystemKw,
        language: input.language,
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

  updateProfile(
    userId: string,
    tenantId: string,
    patch: { name?: string; language?: UiLanguage; unitsPref?: UnitsPref },
  ) {
    return this.repo.updateProfile(userId, tenantId, patch);
  }

  listTeam(tenantId: string) {
    return this.repo.listMembersWithRoles(tenantId);
  }

  /** Replace role set — invariant: at least one owner always remains (D27). */
  setMemberRoles(tenantId: string, targetUserId: string, roles: RolePreset[]) {
    return this.repo.replaceMemberRoles(tenantId, targetUserId, roles);
  }

  async createInvite(tenantId: string, invitedBy: string, phoneE164: string, roles: RolePreset[]) {
    const member = await this.adminRepo.findMemberByPhone(tenantId, phoneE164);
    if (member)
      throw new ContractException(
        'ALREADY_MEMBER',
        'That phone number is already on your team.',
        HttpStatus.CONFLICT,
      );

    const token = randomBytes(24).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const row = await this.repo.insertInvite({
      tenantId,
      phoneE164,
      roles,
      invitedBy,
      tokenHash,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });
    return { row, token };
  }

  listInvites(tenantId: string, limit: number) {
    return this.repo.listInvites(tenantId, limit);
  }

  async revokeInvite(tenantId: string, inviteId: string) {
    const row = await this.repo.revokePendingInvite(tenantId, inviteId);
    if (!row) throw new NotFoundException('Invite not found or not pending.');
    return row;
  }

  /** Token redeem — admin path (invitee has no tenant context yet); one transaction. */
  async acceptInvite(userId: string, phoneE164: string, token: string, userName: string) {
    const already = await this.adminRepo.resolveTenant(userId);
    if (already.tenantId) return { kind: 'ALREADY_ONBOARDED' as const };

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invite = await this.adminRepo.findInviteByTokenHash(tokenHash);
    if (!invite) return { kind: 'NOT_FOUND' as const };
    if (invite.status !== 'pending' || invite.expiresAt < new Date())
      return { kind: 'INVITE_NOT_PENDING' as const };
    if (invite.phoneE164 !== phoneE164) return { kind: 'PHONE_MISMATCH' as const };

    await this.adminRepo.redeemInvite({
      inviteId: invite.id,
      tenantId: invite.tenantId,
      userId,
      userName,
      phoneE164,
      roles: invite.roles,
    });
    await this.auth.api
      .addMember({ body: { organizationId: invite.tenantId, userId, role: 'member' } })
      .catch(() => undefined);
    return { kind: 'OK' as const, tenantId: invite.tenantId, userId };
  }
}
