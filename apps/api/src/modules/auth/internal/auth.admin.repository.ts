import { type Db, membershipRole, session, tenantMembership, userAccount } from '@heliogrid/db';
import type {
  AuditEventType,
  MeasurementSystem,
  PlatformKind,
  UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../../common/db/admin.token';
import { recordAuditEntry } from '../../audit/audit.public';

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
    return this.db.transaction(async (tx) => {
      const [inserted] = await tx
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
      await this.recordAuthAct(
        tx,
        'auth.signed_in',
        row.userAccountId,
        row.activeTenantId,
        row.now,
      );
      return inserted;
    });
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
    // A backgrounded mobile refresh extends nothing and marks no activity: it only mints a
    // token, and an UPDATE with nothing to set is a query error, not a no-op.
    if (touch.expiresAt === null && touch.lastForegroundActivityAt === null) return;
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

  /**
   * Binds a company to a session, and records the sign-in that company never saw (`F2-22`). The
   * signer verified their code BEFORE the company existed, so nothing was written then; this is
   * the moment they begin acting under it, and without the entry every company's founding log
   * opens with a sign-OUT that has no sign-in.
   */
  async setActiveTenant(sessionId: string, tenantId: string, at: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [bound] = await tx
        .update(session)
        .set({ activeTenantId: tenantId })
        .where(eq(session.id, sessionId))
        .returning({ userAccountId: session.userAccountId });
      if (!bound) return;
      await this.recordAuthAct(tx, 'auth.signed_in', bound.userAccountId, tenantId, at);
    });
  }

  async revokeSession(id: string, at: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [revoked] = await tx
        .update(session)
        .set({ revokedAt: new Date(at) })
        .where(and(eq(session.id, id), isNull(session.revokedAt)))
        .returning({ userAccountId: session.userAccountId, tenantId: session.activeTenantId });
      // A second sign-out on the same session revokes nothing and records nothing: the log holds
      // what the product performed, and it performed nothing.
      if (!revoked) return;
      await this.recordAuthAct(tx, 'auth.signed_out', revoked.userAccountId, revoked.tenantId, at);
    });
  }

  /** Every live session of one account, in ONE write — the revocation sweep (`M01-07`). */
  async revokeAllSessions(userAccountId: string, at: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      const revoked = await tx
        .update(session)
        .set({ revokedAt: new Date(at) })
        .where(and(eq(session.userAccountId, userAccountId), isNull(session.revokedAt)))
        .returning({ tenantId: session.activeTenantId });
      // One act, one entry in each company the person was signed into: an audit log is a
      // tenant's own, so a sweep across several of them is several tenants' news.
      for (const tenantId of new Set(revoked.map((row) => row.tenantId))) {
        await this.recordAuthAct(tx, 'auth.signed_out_everywhere', userAccountId, tenantId, at);
      }
    });
  }

  /**
   * Every live session of one account acting under one company — what a deactivation ends
   * (`F2-20`). It writes no entry of its own: the deactivation that called it already recorded
   * the act, and the log records acts rather than their consequences.
   */
  async revokeSessionsUnder(userAccountId: string, tenantId: string, at: number): Promise<void> {
    await this.db
      .update(session)
      .set({ revokedAt: new Date(at) })
      .where(
        and(
          eq(session.userAccountId, userAccountId),
          eq(session.activeTenantId, tenantId),
          isNull(session.revokedAt),
        ),
      );
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

  /**
   * One auth act, in the SAME transaction as the session write it belongs to (`F2-22`). An
   * account signing in or out of no company writes nothing: the log is a tenant's own (`F2-23`)
   * and there is no tenant to own the entry. The person is both actor and subject.
   */
  private async recordAuthAct(
    tx: Parameters<Parameters<Db['transaction']>[0]>[0],
    eventType: AuditEventType,
    userAccountId: string,
    tenantId: string | null,
    at: number,
  ): Promise<void> {
    if (tenantId === null) return;
    await recordAuditEntry(tx, {
      tenantId,
      eventType,
      actorKind: 'tenant_user',
      actorRef: userAccountId,
      occurredAt: new Date(at),
      blocked: false,
      subjectKind: 'user_account',
      subjectRef: userAccountId,
      changePayload: null,
    });
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
