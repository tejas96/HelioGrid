import {
  ACCESS_REMOVED,
  authContract,
  SESSION_RESOLVER,
  type SessionResolver,
} from '@heliogrid/contracts';
import { UI_LANGUAGES, UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/domain';
import { Controller, HttpStatus, Inject, Req, UnauthorizedException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import {
  carriesCredential,
  clearAuthCookies,
  cookieOf,
  responseOf,
  SESSION_COOKIE,
  setSessionCookie,
  setTokenCookie,
} from '../../common/auth/cookies';
import { sessionIdOf, sessionOf } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { AuthService } from './auth.service';
import { OtpService } from './internal/otp.service';

/**
 * The reader's language for the code message: the first `Accept-Language` tag the product
 * ships (`F3-03`), else the source language. Nothing about the account is known yet at request
 * time — the message goes to a phone, not a user.
 */
function languageOf(req: Request): UiLanguage {
  const first = req.headers['accept-language']?.split(',')[0]?.trim().split('-')[0];
  return UI_LANGUAGES.find((language) => language === first) ?? UI_SOURCE_LOCALE;
}

@Controller()
export class AuthController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(OtpService) private readonly otp: OtpService,
    @Inject(SESSION_RESOLVER) private readonly sessions: SessionResolver,
  ) {}

  @TsRestHandler(authContract)
  @RouteAccessMap(authContract, {
    requestOtp: 'public',
    verifyOtp: 'public',
    signInWithProvider: 'public',
    refresh: 'session-cookie',
    signOut: 'session',
    signOutEverywhere: 'session',
    // Public so a signed-out visitor is answered, not refused (`D104`); the handler resolves.
    session: 'public',
  })
  handler(@Req() req: Request) {
    const res = responseOf(req);
    return tsRestHandler(authContract, {
      requestOtp: async ({ body }) => ({
        status: 200,
        body: await this.otp.request(body.phoneE164, body.channel, languageOf(req), Date.now()),
      }),
      verifyOtp: async ({ body }) => {
        const opened = await this.auth.verifyOtp(
          body.challengeId,
          body.code,
          body.platform,
          languageOf(req),
          cookieOf(req, SESSION_COOKIE),
          Date.now(),
        );
        setSessionCookie(res, opened.session.secret, opened.session.expiresAt);
        setTokenCookie(res, opened.token.token, opened.token.expiresAt);
        return { status: 200, body: opened.projection };
      },
      signInWithProvider: async ({ params, body }) => {
        const opened = await this.auth.signInWithProvider(
          params.provider,
          body,
          languageOf(req),
          cookieOf(req, SESSION_COOKIE),
          Date.now(),
        );
        setSessionCookie(res, opened.session.secret, opened.session.expiresAt);
        setTokenCookie(res, opened.token.token, opened.token.expiresAt);
        return { status: 200, body: opened.projection };
      },
      refresh: async ({ body }) => {
        const secret = cookieOf(req, SESSION_COOKIE);
        const refreshed =
          secret === undefined
            ? ({ verdict: 'signed-out' } as const)
            : await this.auth.refresh(secret, body.foreground, Date.now());
        if (refreshed.verdict !== 'renew') {
          clearAuthCookies(res);
          if (refreshed.verdict === 'signed-out') throw new UnauthorizedException('Sign in again.');
          // A route code, not a base one: a bare Nest 401 would carry UNAUTHENTICATED.
          throw new ContractException(
            ACCESS_REMOVED,
            'Your access was removed.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        setTokenCookie(res, refreshed.token, refreshed.expiresAt);
        return {
          status: 200,
          body: { tokenExpiresAt: new Date(refreshed.expiresAt).toISOString() },
        };
      },
      signOut: async () => {
        await this.auth.signOut(sessionIdOf(req), Date.now());
        clearAuthCookies(res);
        return { status: 204, body: undefined };
      },
      signOutEverywhere: async () => {
        await this.auth.signOutEverywhere(sessionOf(req).actor.userId, Date.now());
        clearAuthCookies(res);
        return { status: 204, body: undefined };
      },
      session: async () => {
        const resolved = await this.sessions.resolve(req);
        if (resolved !== null) return { status: 200, body: resolved.session };
        if (carriesCredential(req)) throw new UnauthorizedException('Sign in to continue.');
        return { status: 200, body: { signedIn: false as const } };
      },
    });
  }
}
