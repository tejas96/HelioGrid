import { type BaseErrorCode, errorHttpStatusByCode } from '@heliogrid/contracts';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Maps everything escaping a controller to the canonical envelope
 * `{ error: { code, message, details?, requestId } }` (rules/api.md). Typed domain
 * errors (Track A+) will carry their own codes; unknown errors are opaque INTERNAL —
 * never stack traces or SQL.
 */
@Catch()
export class EnvelopeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EnvelopeExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (!(exception instanceof HttpException)) {
      // The client sees opaque INTERNAL; the log keeps the truth (never in the response).
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      );
    }
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = req.id ?? (req.headers['x-request-id'] as string) ?? 'unknown';

    let status = 500;
    let code: BaseErrorCode = 'INTERNAL';
    let message = 'Something went wrong on our side.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const byStatus = (Object.entries(errorHttpStatusByCode) as [BaseErrorCode, number][]).find(
        ([, s]) => s === status,
      );
      code = byStatus?.[0] ?? 'INTERNAL';
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message?.toString() ?? exception.message);
    }

    res.status(status).json({ error: { code, message, requestId } });
  }
}
