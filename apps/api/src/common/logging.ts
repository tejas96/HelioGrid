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
  'req.body.email',
  'req.body.otp',
  'req.body.password',
  'req.body.phone',
  'req.body.phone_e164',
  'req.body.phoneE164',
  'req.params.phone',
  'req.query.email',
  'req.query.phone',
];

/**
 * `redact` reaches STRUCTURED fields only, so `req.query.phone` is censored while the same
 * value sitting inside the raw `req.url` string is not:
 * `?phone=%2B91…` reached the log in full with `req.query.phone` already `[redacted]`.
 * The path alone is what a log reader needs; the parameters survive, redactable, in
 * `req.query`.
 */
function requestSerializer(req: Parameters<typeof stdSerializers.req>[0]) {
  const serialized = stdSerializers.req(req);
  return { ...serialized, url: String(serialized.url ?? '').split('?')[0] };
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

function errorSerializer(error: Error): Record<string, unknown> {
  const serialized = stdSerializers.err(error) as unknown as Record<string, unknown>;
  const safe: Record<string, unknown> = {};
  for (const key of LOGGED_ERROR_KEYS) {
    if (serialized[key] !== undefined) safe[key] = serialized[key];
  }
  return safe;
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
