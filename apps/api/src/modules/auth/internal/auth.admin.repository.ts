import { type Db, membershipRole, session, tenantMembership, userAccount } from '@heliogrid/db';
import type { MeasurementSystem, PlatformKind, UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../../common/db/admin.token';

export interface AccountRow {
  readonly id: string;
  readonly phoneE164: string;
  readonly name: string | null;
  readonly interfaceLanguage: UiLanguage;
  readonly unitPreference: MeasurementSystem;
}

export interface SessionRow {
  readonly id: string;
  readonly userAccountId: string;
  readonly platformKind: PlatformKind;
  readonly activeTenantId: string | null;
  readonly expiresAt: Date;
  readonly lastForegroundActivityAt: Date | null;
  readonly revokedAt: Date | null;
}

/** A membership with the presets stacked on it — what a token's claims are compared against. */
export interface MembershipRow {
  readonly id: string;
  readonly tenantId: string;
  readonly status: 'invited' | 'active' | 'deactivated';
  readonly authorizationVersion: number;
  readonly roles: readonly string[];
}

/**
 * The identity spine's writer and its cross-tenant reads: accounts, sessions and the membership
 * standing a session acts under. Every table here is a platform table — a session belongs to a
 * person, not a company — so this rides the admin pool by design; the sign-in codes have their
 * own repository beside this one.
 */
@Injectable()
export class AuthAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async accountByPhone(phoneE164: string): Promise<AccountRow | null> {
    const [row] = await this.db
      .select(accountColumns())
      .from(userAccount)
      .where(eq(userAccount.phoneE164, phoneE164))
      .limit(1);
    return row ?? null;
  }

  async accountById(id: string): Promise<AccountRow | null> {
    const [row] = await this.db
      .select(accountColumns())
      .from(userAccount)
      .where(eq(userAccount.id, id))
      .limit(1);
    return row ?? null;
  }

  async createAccount(row: {
    phoneE164: string;
    interfaceLanguage: UiLanguage;
    unitPreference: MeasurementSystem;
    now: number;
  }): Promise<AccountRow> {
    const [inserted] = await this.db
      .insert(userAccount)
      .values({
        phoneE164: row.phoneE164,
        interfaceLanguage: row.interfaceLanguage,
        unitPreference: row.unitPreference,
        createdAt: new Date(row.now),
      })
      .onConflictDoNothing({ target: userAccount.phoneE164 })
      .returning(accountColumns());
    if (inserted) return inserted;
    // Lost the race to a concurrent first sign-in of the same phone: the row exists now.
    const existing = await this.accountByPhone(row.phoneE164);
    if (!existing) throw new Error('user_account neither inserted nor found');
    return existing;
  }

  async createSession(row: {
    userAccountId: string;
    tokenHash: string;
    platformKind: PlatformKind;
    activeTenantId: string | null;
    expiresAt: number;
    foreground: boolean;
    now: number;
  }): Promise<SessionRow> {
    const [inserted] = await this.db
      .insert(session)
      .values({
        userAccountId: row.userAccountId,
        tokenHash: row.tokenHash,
        platformKind: row.platformKind,
        activeTenantId: row.activeTenantId,
        expiresAt: new Date(row.expiresAt),
        lastForegroundActivityAt: row.foreground ? new Date(row.now) : null,
        createdAt: new Date(row.now),
      })
      .returning(sessionColumns());
    if (!inserted) throw new Error('session insert returned no row');
    return inserted;
  }

  async sessionByTokenHash(tokenHash: string): Promise<SessionRow | null> {
    const [row] = await this.db
      .select(sessionColumns())
      .from(session)
      .where(eq(session.tokenHash, tokenHash))
      .limit(1);
    return row ?? null;
  }

  async sessionById(id: string): Promise<SessionRow | null> {
    const [row] = await this.db
      .select(sessionColumns())
      .from(session)
      .where(eq(session.id, id))
      .limit(1);
    return row ?? null;
  }

  async touchSession(
    id: string,
    touch: { expiresAt: number | null; lastForegroundActivityAt: number | null },
  ): Promise<void> {
    await this.db
      .update(session)
      .set({
        expiresAt: touch.expiresAt === null ? undefined : new Date(touch.expiresAt),
        lastForegroundActivityAt:
          touch.lastForegroundActivityAt === null
            ? undefined
            : new Date(touch.lastForegroundActivityAt),
      })
      .where(eq(session.id, id));
  }

  async setActiveTenant(sessionId: string, tenantId: string): Promise<void> {
    await this.db
      .update(session)
      .set({ activeTenantId: tenantId })
      .where(eq(session.id, sessionId));
  }

  async revokeSession(id: string, at: number): Promise<void> {
    await this.db
      .update(session)
      .set({ revokedAt: new Date(at) })
      .where(and(eq(session.id, id), isNull(session.revokedAt)));
  }

  /** Every live session of one account, in ONE write — the revocation sweep (`M01-07`). */
  async revokeAllSessions(userAccountId: string, at: number): Promise<void> {
    await this.db
      .update(session)
      .set({ revokedAt: new Date(at) })
      .where(and(eq(session.userAccountId, userAccountId), isNull(session.revokedAt)));
  }

  /** The membership an account holds in one tenant, with its presets; null when it holds none. */
  async membership(userAccountId: string, tenantId: string): Promise<MembershipRow | null> {
    const [row] = await this.db
      .select({
        id: tenantMembership.id,
        tenantId: tenantMembership.tenantId,
        status: tenantMembership.status,
        authorizationVersion: tenantMembership.authorizationVersion,
      })
      .from(tenantMembership)
      .where(
        and(
          eq(tenantMembership.userAccountId, userAccountId),
          eq(tenantMembership.tenantId, tenantId),
        ),
      )
      .limit(1);
    if (!row) return null;
    const roles = await this.db
      .select({ rolePreset: membershipRole.rolePreset })
      .from(membershipRole)
      .where(eq(membershipRole.membershipId, row.id));
    return { ...row, roles: roles.map((r) => r.rolePreset) };
  }

  /** The account's most recent ACTIVE membership — the company a fresh session acts under. */
  async latestActiveMembership(userAccountId: string): Promise<MembershipRow | null> {
    const [row] = await this.db
      .select({ tenantId: tenantMembership.tenantId })
      .from(tenantMembership)
      .where(
        and(
          eq(tenantMembership.userAccountId, userAccountId),
          inArray(tenantMembership.status, ['active']),
        ),
      )
      .orderBy(desc(tenantMembership.createdAt))
      .limit(1);
    return row ? this.membership(userAccountId, row.tenantId) : null;
  }
}

function accountColumns() {
  return {
    id: userAccount.id,
    phoneE164: userAccount.phoneE164,
    name: userAccount.name,
    interfaceLanguage: userAccount.interfaceLanguage,
    unitPreference: userAccount.unitPreference,
  };
}

function sessionColumns() {
  return {
    id: session.id,
    userAccountId: session.userAccountId,
    platformKind: session.platformKind,
    activeTenantId: session.activeTenantId,
    expiresAt: session.expiresAt,
    lastForegroundActivityAt: session.lastForegroundActivityAt,
    revokedAt: session.revokedAt,
  };
}
