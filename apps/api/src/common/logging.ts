import { stdSerializers } from 'pino';
import type { Options } from 'pino-http';
import { REQUEST_ID_HEADER, resolveRequestId, safeRequestId } from './request-id';

/**
 * The ONE authoring of what a log line may contain. It lives HERE, in API infrastructure —
 * there is no shared `packages/config/logging.ts`, and a package holding it would have to
 * depend on pino to be useful, which no shared package may.
 *
 * Redaction is DPDP hygiene for the Indian launch market and the equivalent regime in every
 * market added after it (docs/engineering/08 §9).
 */
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers.set-cookie',
  'res.headers.set-cookie',
  // Wildcards catch the same field wherever a serializer nests it; the explicit req.* paths
  // below catch the one level `*.` does not reach.
  '*.authorization',
  '*.cookie',
  '*.email',
  '*.otp',
  '*.password',
  '*.phone',
  '*.phone_e164',
  '*.phoneE164',
  '*.refreshToken',
  '*.token',
  // The business profile's financial and business-PII parts, and the regulated tax
  // identifiers, wherever a serializer nests them (`T-M01-026`, the sensitive-data register).
  '*.address',
  '*.postalCode',
  '*.bankDetails',
  '*.bankDetailsTyped',
  '*.registrations',
  'req.body.email',
  'req.body.otp',
  'req.body.password',
  'req.body.phone',
  'req.body.phone_e164',
  'req.body.phoneE164',
  'req.params.phone',
  'req.query.email',
  'req.query.phone',
  // A Temporal activity's task token completes or fails that activity; the SDK's lines carry
  // it at the top level (`temporal.sdk-logger.ts`).
  'taskToken',
];

/**
 * A path segment that IS a secret: the invite link's token opens a stranger's invite
 * (`invitation.ts`, `landingParamsSchema`), so it never reaches a log line.
 */
const SECRET_IN_PATH = /^(\/invitations\/landing\/)[^/]+/i;

/**
 * `redact` reaches STRUCTURED fields only, so `req.query.phone` is censored while the same
 * value sitting inside the raw `req.url` string is not:
 * `?phone=%2B91…` reached the log in full with `req.query.phone` already `[redacted]`.
 * The path alone is what a log reader needs; the parameters survive, redactable, in
 * `req.query`. The route parameters only repeat the path, secret segments included, so they
 * are dropped.
 */
export function loggedRequest<R extends { url?: unknown; params?: unknown }>(
  serialized: R,
): Omit<R, 'params'> & { url: string } {
  const { params: _repeatsThePath, ...rest } = serialized;
  return { ...rest, url: loggedPath(String(serialized.url ?? '')) };
}

/** The path a log line may show: no query string, and no secret segment (`SECRET_IN_PATH`). */
export function loggedPath(url: string): string {
  const path = url.split('?')[0] ?? '';
  return path.replace(SECRET_IN_PATH, '$1[redacted]');
}

function requestSerializer(req: Parameters<typeof stdSerializers.req>[0]) {
  return loggedRequest(stdSerializers.req(req));
}

/**
 * An error's own payload is not a log field and cannot be redacted path-by-path: a Nest
 * `HttpException` carries `getResponse()`, and for a ts-rest request-validation failure that
 * is the submitted data's Zod issues — plus, on `invalid_literal` and `invalid_enum_value`,
 * the submitted VALUE. Redaction cannot reach `err.response.bodyResult.issues[3].received`.
 *
 * So the shape is an ALLOWLIST, not a denylist: whatever a library hangs on its error next,
 * it is dropped by default. What survives is what a 5xx is actually debugged from.
 */
const LOGGED_ERROR_KEYS = ['type', 'message', 'stack', 'code', 'status', 'statusCode'] as const;

/**
 * pino-http hands this pino's own serialisation of the error, whose `type` reads `Object` and
 * whose causes are gone; `raw` is the error itself.
 */
function errorSerializer(logged: Error & { readonly raw?: Error }): Record<string, unknown> {
  const error = logged.raw ?? logged;
  const serialized = stdSerializers.err(error) as unknown as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const key of LOGGED_ERROR_KEYS) {
    if (serialized[key] !== undefined) safe[key] = serialized[key];
  }
  return withoutBoundValues(safe, error);
}

/** Drizzle's error for a failed query: `Failed query: <sql>\nparams: <the values it bound>`. */
interface FailedQuery extends Error {
  readonly query: string;
  readonly params: readonly unknown[];
  readonly cause?: { readonly code?: unknown };
}

function isFailedQuery(error: Error): error is FailedQuery {
  const { query, params } = error as Partial<FailedQuery>;
  return typeof query === 'string' && Array.isArray(params);
}

function errorChain(error: Error): Error[] {
  const chain: Error[] = [];
  for (
    let link: unknown = error;
    link instanceof Error && !chain.includes(link);
    link = link.cause
  ) {
    chain.push(link);
  }
  return chain;
}

/**
 * A failed query's message names the values it bound — a phone number, a name — and the
 * message and stack of the error and of every error it causes repeat it. Each is written as
 * the SQL alone, whose values are placeholders; the database's own message stays, and its
 * SQLSTATE is the line's `code`. The database error's `detail` (`Key (phone)=(…)`) is never
 * written.
 */
function withoutBoundValues(serialized: Record<string, unknown>, error: Error) {
  const failedQueries = errorChain(error).filter(isFailedQuery);
  const [failedQuery] = failedQueries;
  if (failedQuery === undefined) return serialized;

  const asSqlAlone = (text: unknown) =>
    typeof text === 'string'
      ? failedQueries.reduce(
          (written, { message, query }) => written.replaceAll(message, `Failed query: ${query}`),
          text,
        )
      : text;
  const sqlState = failedQuery.cause?.code;
  return {
    ...serialized,
    message: asSqlAlone(serialized.message),
    stack: asSqlAlone(serialized.stack),
    code: serialized.code ?? (typeof sqlState === 'string' ? sqlState : undefined),
  };
}

/**
 * Request ids are assigned by `assignRequestId` before this module ever sees the request, so
 * `req.id` is already the bounded, echoed value — pino only has to trust it.
 */
export const pinoHttpOptions: Options = {
  genReqId: (req, res) => {
    const requestId = safeRequestId(req.id) ?? resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    res.setHeader(REQUEST_ID_HEADER, requestId);
    return requestId;
  },
  serializers: { req: requestSerializer, err: errorSerializer },
  redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
  autoLogging: true,
};
