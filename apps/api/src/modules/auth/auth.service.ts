import { createHash, randomBytes } from 'node:crypto';
import type { SessionProjection } from '@heliogrid/contracts';
import {
  isSessionLive,
  type PlatformKind,
  refreshedExpiry,
  sessionExpiresAt,
  type UiLanguage,
} from '@heliogrid/domain';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type AccountRow, AuthAdminRepository } from './internal/auth.admin.repository';
import { OtpService } from './internal/otp.service';
import { claimsOf, lifeOf, projectionOf } from './internal/session.projection';
import { TokenService } from './internal/token.service';

const SESSION_SECRET_BYTES = 32;

/** What opening a session hands the controller: the projection, and the two credentials to set. */
export interface OpenedSession {
  readonly projection: SessionProjection;
  readonly session: { readonly secret: string; readonly expiresAt: number };
  readonly token: { readonly token: string; readonly expiresAt: number };
}

/**
 * Sessions (`M01-07`) and the accounts they belong to (`M01-18`): a verified phone becomes an
 * account once and a session every time; the expiry, the token life and the compare are
 * domain's, and this orders the reads and writes around them.
 */
@Injectable()
export class AuthService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(AuthAdminRepository) private readonly store: AuthAdminRepository,
    @Inject(OtpService) private readonly otp: OtpService,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  async verifyOtp(
    challengeId: string,
    code: string,
    platform: PlatformKind,
    language: UiLanguage,
    now: number,
  ): Promise<OpenedSession> {
    const { phoneE164 } = await this.otp.verify(challengeId, code, now);
    const account =
      (await this.store.accountByPhone(phoneE164)) ??
      (await this.createAccount(phoneE164, language, now));
    return this.openSession(account, platform, now);
  }

  /** A new token from the session cookie, while the session lives (`M01-07`). */
  async refresh(
    sessionSecret: string,
    foreground: boolean,
    now: number,
  ): Promise<{ token: string; expiresAt: number } | null> {
    const row = await this.store.sessionByTokenHash(hashSecret(sessionSecret));
    if (!row || !isSessionLive(lifeOf(row), now)) return null;
    await this.store.touchSession(row.id, {
      expiresAt: refreshedExpiry(row.platformKind, now, foreground),
      lastForegroundActivityAt: foreground ? now : null,
    });
    const membership =
      row.activeTenantId === null
        ? null
        : await this.store.membership(row.userAccountId, row.activeTenantId);
    return this.tokens.mint(claimsOf(row.userAccountId, row.id, membership), now);
  }

  async signOut(sessionId: string, now: number): Promise<void> {
    await this.store.revokeSession(sessionId, now);
  }

  /** Every device of the actor, in one write; each dies with its token (`M01-07`). */
  async signOutEverywhere(userId: string, now: number): Promise<void> {
    await this.store.revokeAllSessions(userId, now);
  }

  /**
   * Binds a company to a session — the signup that just created one (`M01-01`) — and mints the
   * token that carries the new membership.
   */
  async adoptTenant(
    sessionId: string,
    userId: string,
    tenantId: string,
    now: number,
  ): Promise<{ projection: SessionProjection; token: { token: string; expiresAt: number } }> {
    await this.store.setActiveTenant(sessionId, tenantId);
    const [account, row, membership] = await Promise.all([
      this.store.accountById(userId),
      this.store.sessionById(sessionId),
      this.store.membership(userId, tenantId),
    ]);
    if (!account || !row || !membership) throw new NotFoundException('The session is gone.');
    const token = await this.tokens.mint(claimsOf(userId, sessionId, membership), now);
    return { projection: projectionOf(account, membership, row), token };
  }

  private async createAccount(
    phoneE164: string,
    language: UiLanguage,
    now: number,
  ): Promise<AccountRow> {
    const pack = await this.otp.marketOf(phoneE164);
    return this.store.createAccount({
      phoneE164,
      interfaceLanguage: language,
      unitPreference: pack.formats.measurementSystem,
      now,
    });
  }

  private async openSession(
    account: AccountRow,
    platform: PlatformKind,
    now: number,
  ): Promise<OpenedSession> {
    const membership = await this.store.latestActiveMembership(account.id);
    const secret = randomBytes(SESSION_SECRET_BYTES).toString('base64url');
    const row = await this.store.createSession({
      userAccountId: account.id,
      tokenHash: hashSecret(secret),
      platformKind: platform,
      activeTenantId: membership?.tenantId ?? null,
      expiresAt: sessionExpiresAt(platform, now),
      foreground: true,
      now,
    });
    const token = await this.tokens.mint(claimsOf(account.id, row.id, membership), now);
    return {
      projection: projectionOf(account, membership, row),
      session: { secret, expiresAt: row.expiresAt.getTime() },
      token,
    };
  }
}

function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
