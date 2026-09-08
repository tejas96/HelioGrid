import { authContract } from '@heliogrid/contracts';
import { UI_LANGUAGES, UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/domain';
import { Controller, Inject, Req, UnauthorizedException } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import {
  clearAuthCookies,
  cookieOf,
  responseOf,
  SESSION_COOKIE,
  setSessionCookie,
  setTokenCookie,
} from '../../common/auth/cookies';
import { sessionIdOf, sessionOf } from '../../common/auth/session-context';
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
  ) {}

  @TsRestHandler(authContract)
  @RouteAccessMap(authContract, {
    requestOtp: 'public',
    verifyOtp: 'public',
    refresh: 'session-cookie',
    signOut: 'session',
    signOutEverywhere: 'session',
    session: 'session',
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
          Date.now(),
        );
        setSessionCookie(res, opened.session.secret, opened.session.expiresAt);
        setTokenCookie(res, opened.token.token, opened.token.expiresAt);
        return { status: 200, body: opened.projection };
      },
      refresh: async ({ body }) => {
        const secret = cookieOf(req, SESSION_COOKIE);
        const minted =
          secret === undefined
            ? null
            : await this.auth.refresh(secret, body.foreground, Date.now());
        if (minted === null) {
          clearAuthCookies(res);
          throw new UnauthorizedException('Sign in again.');
        }
        setTokenCookie(res, minted.token, minted.expiresAt);
        return { status: 200, body: { tokenExpiresAt: new Date(minted.expiresAt).toISOString() } };
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
      session: async () => ({ status: 200, body: sessionOf(req) }),
    });
  }
}
