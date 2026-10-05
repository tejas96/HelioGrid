import {
  IDENTITY_PROVIDERS,
  type IdentityProviders,
  type LoginProvider,
  type LoginRefusal,
  type ProviderSignIn,
  type SessionProjection,
} from '@heliogrid/contracts';
import {
  loginBindingRoad,
  type PlatformKind,
  type RefreshVerdict,
  refreshedExpiry,
  refreshVerdict,
  sessionExpiresAt,
  type UiLanguage,
} from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hashSecret, randomSecret } from '../../common/auth/secrets';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackService } from '../market/market.public';
import { type AccountRow, AuthAdminRepository } from './internal/auth.admin.repository';
import {
  LoginBindingAdminRepository,
  type LoginIdentity,
} from './internal/login-binding.admin.repository';
import { codeAlreadyUsed, OtpService } from './internal/otp.service';
import { claimsOf, lifeOf, projectionOf } from './internal/session.projection';
import { TokenService } from './internal/token.service';

/** What a refresh answers: a new token, or why this session cannot renew (`M01-07`, `S1.wrong.4`). */
export type Refreshed =
  | { readonly verdict: 'renew'; readonly token: string; readonly expiresAt: number }
  | { readonly verdict: Exclude<RefreshVerdict, 'renew'> };

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
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(LoginBindingAdminRepository) private readonly binding: LoginBindingAdminRepository,
    @Inject(IDENTITY_PROVIDERS) private readonly providers: IdentityProviders,
  ) {}

  /**
   * A verified code opens a session. `handedOverFrom` is the session cookie the device still
   * carried: on a shared field phone the next person's sign-in ENDS the previous person's session
   * (`F4-37`) rather than leaving it live until its own expiry, so nothing of the first user
   * survives the switch on the server either.
   */
  async verifyOtp(
    challengeId: string,
    code: string,
    platform: PlatformKind,
    language: UiLanguage,
    handedOverFrom: string | undefined,
    now: number,
  ): Promise<OpenedSession> {
    const { phoneE164 } = await this.otp.verify(challengeId, code, now);
    if (handedOverFrom !== undefined) await this.endHandedOverSession(handedOverFrom, now);
    const account =
      (await this.store.accountByPhone(phoneE164)) ??
      (await this.createAccount(phoneE164, language, now));
    return this.openSession(account, platform, now);
  }

  /**
   * The provider door (`M01-02`). A login linked to an account signs in as it — the SMS lock never
   * touches this road (`M01-04`). An unlinked login answers `LOGIN_NOT_LINKED` until the device
   * sends the code for a phone in `link`; that code is checked by the verify rules and spent with
   * the bind, so a refused bind leaves it usable. `handedOverFrom` ends the device's last session,
   * as a verify does (`F4-37`).
   */
  async signInWithProvider(
    provider: LoginProvider,
    input: ProviderSignIn,
    language: UiLanguage,
    handedOverFrom: string | undefined,
    now: number,
  ): Promise<OpenedSession> {
    const login = { provider, subject: await this.verifiedSubject(provider, input) };
    const linked = await this.binding.accountByLogin(login);
    const requestedPhoneE164 =
      input.link === undefined ? null : await this.otp.phoneOf(input.link.challengeId);
    const road = loginBindingRoad({
      linkedPhoneE164: linked?.phoneE164 ?? null,
      requestedPhoneE164,
    });
    if (road === 'not-linked') throw loginRefusal('LOGIN_NOT_LINKED');
    if (road === 'linked-elsewhere') throw loginRefusal('LOGIN_LINKED_ELSEWHERE');
    const account =
      road === 'session' && linked !== null
        ? linked
        : await this.bind(login, input.link, language, now);
    if (handedOverFrom !== undefined) await this.endHandedOverSession(handedOverFrom, now);
    return this.openSession(account, input.platform, now);
  }

  /**
   * A new token from the session cookie, while the session lives (`M01-07`) — or why not. The
   * membership is read BEFORE the session is touched: a removal is named even when the
   * deactivation's sweep never revoked this session, which is what keeps `D1` true if it failed.
   */
  async refresh(sessionSecret: string, foreground: boolean, now: number): Promise<Refreshed> {
    const row = await this.store.sessionByTokenHash(hashSecret(sessionSecret));
    if (!row) return { verdict: 'signed-out' };
    const membership =
      row.activeTenantId === null
        ? null
        : await this.store.membership(row.userAccountId, row.activeTenantId);
    const verdict = refreshVerdict(lifeOf(row), membership, now);
    if (verdict !== 'renew') return { verdict };
    await this.store.touchSession(row.id, {
      expiresAt: refreshedExpiry(row.platformKind, now, foreground),
      lastForegroundActivityAt: foreground ? now : null,
    });
    const minted = await this.tokens.mint(claimsOf(row.userAccountId, row.id, membership), now);
    return { verdict, ...minted };
  }

  async signOut(sessionId: string, now: number): Promise<void> {
    await this.store.revokeSession(sessionId, now);
  }

  /** Every device of the actor, in one write; each dies with its token (`M01-07`). */
  async signOutEverywhere(userId: string, now: number): Promise<void> {
    await this.store.revokeAllSessions(userId, now);
  }

  /**
   * Every device the person uses in THIS company, in one write; a membership they hold elsewhere
   * keeps its sessions (`F2-20`). Each token dies with its life, as a sign-out-everywhere's does.
   */
  async revokeSessionsUnder(tenantId: string, userId: string, now: number): Promise<void> {
    await this.store.revokeSessionsUnder(userId, tenantId, now);
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
    await this.store.setActiveTenant(sessionId, tenantId, now);
    const [account, row, membership] = await Promise.all([
      this.store.accountById(userId),
      this.store.sessionById(sessionId),
      this.store.membership(userId, tenantId),
    ]);
    if (!account || !row || !membership) throw new NotFoundException('The session is gone.');
    const token = await this.tokens.mint(claimsOf(userId, sessionId, membership), now);
    return { projection: projectionOf(account, membership, row), token };
  }

  /** The provider's account id a token proves, or why not: unset ids, a refused token, keys unreachable. */
  private async verifiedSubject(provider: LoginProvider, input: ProviderSignIn): Promise<string> {
    const { checker, audiences } = this.providers[provider];
    if (audiences === undefined) throw loginRefusal('LOGIN_TOKEN_REFUSED');
    const verdict = await checker.verify(input.idToken, audiences, input.nonce);
    if (verdict.kind === 'unavailable') throw loginRefusal('LOGIN_PROVIDER_UNAVAILABLE');
    if (verdict.kind === 'refused') throw loginRefusal('LOGIN_TOKEN_REFUSED');
    return verdict.subject;
  }

  /** The code for the phone proves it; then the phone's account — found or made — takes the login. */
  private async bind(
    login: LoginIdentity,
    link: ProviderSignIn['link'],
    language: UiLanguage,
    now: number,
  ): Promise<AccountRow> {
    if (link === undefined) throw loginRefusal('LOGIN_NOT_LINKED');
    const { phoneE164 } = await this.otp.check(link.challengeId, link.code, now);
    const account =
      (await this.store.accountByPhone(phoneE164)) ??
      (await this.createAccount(phoneE164, language, now));
    const outcome = await this.binding.bindWithCode(link.challengeId, account.id, login, now);
    if (outcome === 'code-spent') codeAlreadyUsed();
    if (outcome === 'phone-taken') throw loginRefusal('LOGIN_PHONE_TAKEN');
    if (outcome === 'linked-elsewhere') throw loginRefusal('LOGIN_LINKED_ELSEWHERE');
    return account;
  }

  /** A stale or unknown cookie ends nothing: the device simply carried no live session. */
  private async endHandedOverSession(sessionSecret: string, now: number): Promise<void> {
    const previous = await this.store.sessionByTokenHash(hashSecret(sessionSecret));
    if (previous !== null) await this.store.revokeSession(previous.id, now);
  }

  private async createAccount(
    phoneE164: string,
    language: UiLanguage,
    now: number,
  ): Promise<AccountRow> {
    const pack = await this.markets.deliverablePack(phoneE164);
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
    const secret = randomSecret();
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

const LOGIN_REFUSALS: Record<LoginRefusal, { status: HttpStatus; message: string }> = {
  LOGIN_TOKEN_REFUSED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The sign-in did not finish. Try again, or use your number.',
  },
  LOGIN_PROVIDER_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'The sign-in provider could not be reached. Try again in a moment.',
  },
  LOGIN_NOT_LINKED: {
    status: HttpStatus.CONFLICT,
    message: 'This login is not linked yet. Confirm your mobile number.',
  },
  LOGIN_PHONE_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'This number is linked to another login of this provider.',
  },
  LOGIN_LINKED_ELSEWHERE: {
    status: HttpStatus.CONFLICT,
    message: 'This login is linked to a different number.',
  },
};

/** A route code, not a base one: a bare Nest exception would carry the generic code (apps/api/CLAUDE.md). */
function loginRefusal(code: LoginRefusal): ContractException {
  const { status, message } = LOGIN_REFUSALS[code];
  return new ContractException(code, message, status);
}
