import { type ErrorDetail, errorHttpStatusByCode } from '@heliogrid/contracts';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Inject,
} from '@nestjs/common';
import {
  RequestValidationError,
  ResponseValidationError as TsRestResponseValidationError,
} from '@ts-rest/nest';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../errors/contract-exception';
import { REQUEST_ID_HEADER, resolveRequestId, safeRequestId } from '../request-id';

type ValidationSource = 'body' | 'headers' | 'params' | 'query';

interface Envelope {
  status: number;
  code: string;
  message: string;
  details?: ErrorDetail[];
}

/**
 * The opaque outcome. Everything the client is NOT allowed to learn — a response that failed
 * its own contract, an undeclared status, a thrown Error — collapses to exactly this, and the
 * truth goes to the log under the same request id.
 */
const OPAQUE_INTERNAL: Envelope = {
  status: errorHttpStatusByCode.INTERNAL,
  code: 'INTERNAL',
  message: 'Something went wrong on our side.',
};

/**
 * Field-addressable `details[]`. `path` is the SCHEMA FIELD path (`phone`, never
 * `body.phone`): clients feed it straight to `applyServerErrors`, where an unmatched path
 * renders nothing at all. Non-body sources are prefixed ONLY when the bare path would be
 * ambiguous — empty, or claimed by two sources in the same failure.
 */
function requestValidationDetails(exception: RequestValidationError): ErrorDetail[] {
  const groups = [
    ['body', exception.body],
    ['headers', exception.headers],
    ['params', exception.pathParams],
    ['query', exception.query],
  ] as const;
  const issues = groups.flatMap(([source, error]) =>
    (error?.issues ?? []).map((issue) => ({
      issue,
      path: issue.path.map(String).join('.'),
      source: source as ValidationSource,
    })),
  );
  const sourcesByPath = new Map<string, Set<ValidationSource>>();
  for (const { path, source } of issues) {
    const sources = sourcesByPath.get(path) ?? new Set<ValidationSource>();
    sources.add(source);
    sourcesByPath.set(path, sources);
  }
  return issues.map(({ issue, path, source }) => {
    const needsSource = source !== 'body' && (!path || (sourcesByPath.get(path)?.size ?? 0) > 1);
    return {
      path: needsSource ? `${source}${path ? `.${path}` : ''}` : path || source,
      issue: issue.message,
    };
  });
}

function httpExceptionMessage(exception: HttpException): string {
  const body = exception.getResponse();
  return typeof body === 'string'
    ? body
    : ((body as { message?: string | string[] }).message?.toString() ?? exception.message);
}

function envelopeFor(exception: unknown): Envelope {
  if (exception instanceof RequestValidationError) {
    return {
      status: errorHttpStatusByCode.VALIDATION_FAILED,
      code: 'VALIDATION_FAILED',
      message: 'Some fields need attention.',
      details: requestValidationDetails(exception),
    };
  }
  if (!(exception instanceof HttpException)) return OPAQUE_INTERNAL;

  const status = exception.getStatus();
  if (exception instanceof ContractException) {
    // The route's contract declares this exact literal — never overwrite it with the generic
    // base code for the status (e.g. ALREADY_ONBOARDED must not become CONFLICT).
    return { status, code: exception.code, message: httpExceptionMessage(exception) };
  }
  const code = Object.entries(errorHttpStatusByCode).find(([, value]) => value === status)?.[0];
  // A status the code→status map does not name is one no contract declares — including the
  // 500 ts-rest raises when a handler answers with an undeclared status. Opaque, not guessed.
  if (code === undefined) return OPAQUE_INTERNAL;
  return status >= 500
    ? { status, code, message: OPAQUE_INTERNAL.message }
    : { status, code, message: httpExceptionMessage(exception) };
}

/** What may be logged about a 5xx: never a stack, a body, a header or a bound parameter. */
function safeErrorLog(exception: unknown, requestId: string): Record<string, unknown> {
  if (exception instanceof TsRestResponseValidationError) {
    return {
      requestId,
      errorType: exception.constructor.name,
      method: exception.appRoute.method,
      path: exception.appRoute.path,
      issuePaths: exception.error.issues.map((issue) => issue.path.map(String).join('.')),
    };
  }
  return {
    requestId,
    errorType: exception instanceof Error ? exception.constructor.name : typeof exception,
  };
}

/**
 * Maps everything escaping a controller to the canonical envelope
 * `{ error: { code, message, details?, requestId } }` (apps/api/CLAUDE.md). Typed domain
 * errors (Track A+) will carry their own codes; unknown errors are opaque INTERNAL —
 * never stack traces or SQL.
 */
@Catch()
export class EnvelopeExceptionFilter implements ExceptionFilter {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(EnvelopeExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = safeRequestId(req.id) ?? resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const { status, code, message, details } = envelopeFor(exception);
    if (status >= 500) {
      // The client sees opaque INTERNAL; the log keeps the truth, under the same request id.
      this.logger.error(safeErrorLog(exception, requestId), 'Request failed internally');
    }
    res.status(status).json({ error: { code, message, details, requestId } });
  }
}
