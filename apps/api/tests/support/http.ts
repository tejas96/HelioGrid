import type { CreateTenant, OtpChallenge, SessionProjection } from '@heliogrid/contracts';
import { IN_PACK } from '@heliogrid/domain';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { createApp } from '../../src/app';
import { ENV } from '../../src/config/env';
import { MarketPackService } from '../../src/modules/market/market.public';
import { skipUnless } from './preconditions';

/**
 * The api over REAL HTTP, inside a test: the same `createApp()` production listens on, listening
 * here on port 0, driven with Node's own `fetch` and a cookie jar. A test that goes through this
 * meets the guard, the validation, the filter and the tenancy precondition a person meets — the
 * repository alone proves none of them.
 *
 * Sign-in is the development number (`DEV_OTP_PHONE` / `DEV_OTP_CODE`), whose code is fixed so
 * no test reads a log. A company is created through `POST /tenants`, the front door's own route,
 * and the session adopts it — so the SECOND company a test creates gives the same person a
 * session under another tenant, which is how cross-tenant is proven on the wire with one number.
 *
 * The IN pack is published on boot through the app's own admin path, exactly as
 * `pack:publish` does and idempotently — a fresh database (CI's) has no pack, and without one the
 * market of the phone resolves to nothing and signup refuses.
 */

/** The api's own reader of the environment — the harness asks it, never `process.env`. */
const DEV_PHONE = ENV.DEV_OTP_PHONE ?? '';
const DEV_CODE = ENV.DEV_OTP_CODE ?? '';

export interface Reply<T = unknown> {
  readonly status: number;
  readonly body: T;
  readonly headers: Headers;
}

export interface Http {
  readonly app: INestApplication;
  readonly baseUrl: string;
  /**
   * With the jar. `body` is JSON-encoded; a reply body is parsed when it is JSON, else null.
   * `headers` are sent as given — the retry key a create carries (`F4-07`).
   */
  call<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<Reply<T>>;
  /** With NO credential at all — what an unauthenticated caller sends. */
  callAnonymously<T = unknown>(method: string, path: string, body?: unknown): Promise<Reply<T>>;
  /** The development number, through the request and verify routes. */
  signIn(): Promise<SessionProjection>;
  /** `POST /tenants`; the session now acts under the company it just created. */
  createCompany(companyName: string): Promise<SessionProjection>;
  /** The companies this harness created, for the caller's teardown. */
  readonly createdTenantIds: readonly string[];
  close(): Promise<void>;
}

/**
 * The harness needs the development number. Absent under CI it THROWS — a lane that lost the
 * key would otherwise skip every wire proof while staying green; absent locally it skips, loudly.
 * A database is not checked here: `ENV` refuses to load without `DATABASE_URL`, so this module
 * never imports.
 */
export function skipWithoutHarness(proof: string, unproven: string): boolean {
  return skipUnless(
    DEV_PHONE !== '' && DEV_CODE !== '',
    proof,
    `no DEV_OTP_PHONE / DEV_OTP_CODE. ${unproven}`,
  );
}

export async function bootHttp(): Promise<Http> {
  const app = await createApp();
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (address === null || typeof address === 'string') {
    throw new Error('the api did not report a TCP port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // Published, never seeded: the same service and the same admin path the command uses, and a
  // no-op when the stored revision already equals the literal.
  await app.get(MarketPackService).publish(IN_PACK, new Date().toISOString());

  const jar = new Map<string, string>();
  const createdTenantIds: string[] = [];

  /** The jar as one `Cookie` header, the way a browser sends it. */
  const cookieHeader = (): string => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');

  /** Every `Set-Cookie` the reply carried, absorbed into the jar — name and value, attributes dropped. */
  const absorbCookies = (res: Response): void => {
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';', 1);
      const eq = pair?.indexOf('=') ?? -1;
      if (pair && eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  };

  /** A JSON body parsed; anything else — an empty reply, a text — is null. */
  const parsedBody = async (res: Response): Promise<unknown> => {
    const text = await res.text();
    if (text === '' || !res.headers.get('content-type')?.includes('application/json')) return null;
    return JSON.parse(text);
  };

  const send = async <T>(
    method: string,
    path: string,
    body: unknown,
    withJar: boolean,
    extra: Record<string, string> = {},
  ): Promise<Reply<T>> => {
    const headers: Record<string, string> = { ...extra };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (withJar && jar.size > 0) headers.cookie = cookieHeader();
    // biome-ignore lint/style/noRestrictedGlobals: this harness is the RAW peer the api serves — it proves the guard, the cookies and the envelope, which the typed client exists to hide from a screen; nothing here ships.
    const res = await fetch(baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    absorbCookies(res);
    return { status: res.status, body: (await parsedBody(res)) as T, headers: res.headers };
  };

  const expectStatus = <T>(what: string, reply: Reply<T>, status: HttpStatus): T => {
    if (reply.status !== status) {
      throw new Error(
        `${what}: expected ${status}, got ${reply.status} ${JSON.stringify(reply.body)}`,
      );
    }
    return reply.body;
  };

  const http: Http = {
    app,
    baseUrl,
    createdTenantIds,
    call: (method, path, body, headers) => send(method, path, body, true, headers),
    callAnonymously: (method, path, body) => send(method, path, body, false),
    async signIn() {
      const challenge = expectStatus(
        'otp request',
        await send<OtpChallenge>(
          'POST',
          '/auth/otp/request',
          { phoneE164: DEV_PHONE, channel: 'sms' },
          true,
        ),
        HttpStatus.OK,
      );
      return expectStatus(
        'otp verify',
        await send<SessionProjection>(
          'POST',
          '/auth/otp/verify',
          { challengeId: challenge.challengeId, code: DEV_CODE, platform: 'web' },
          true,
        ),
        HttpStatus.OK,
      );
    },
    async createCompany(companyName) {
      const body: CreateTenant = { companyName, ownerName: 'Harness Owner', city: 'Pune' };
      const session = expectStatus(
        'company signup',
        await send<SessionProjection>('POST', '/tenants', body, true),
        HttpStatus.CREATED,
      );
      if (session.membership === null) throw new Error('signup returned no membership');
      createdTenantIds.push(session.membership.tenantId);
      return session;
    },
    close: () => app.close(),
  };
  return http;
}
