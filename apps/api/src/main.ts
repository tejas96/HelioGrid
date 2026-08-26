import 'reflect-metadata';
import { errorHttpStatusByCode } from '@heliogrid/contracts';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { json, urlencoded } from 'express';
import { Logger, PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { assertTenancyPrecondition } from './common/db/tenancy-precondition';
import { assignRequestId, REQUEST_ID_HEADER } from './common/request-id';
import { ENV } from './config/env';

const BODY_LIMIT_BYTES = 1_048_576;

function isPayloadTooLarge(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  const bodyError = error as Error & {
    status?: number;
    statusCode?: number;
    type?: string;
  };
  return (
    bodyError.type === 'entity.too.large' ||
    bodyError.status === errorHttpStatusByCode.PAYLOAD_TOO_LARGE ||
    bodyError.statusCode === errorHttpStatusByCode.PAYLOAD_TOO_LARGE
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  const edgeLogger = await app.resolve(PinoLogger);

  app.use(assignRequestId);
  app.enableCors({
    origin: ENV.WEB_ORIGIN,
    credentials: true,
    exposedHeaders: [REQUEST_ID_HEADER],
  });
  app.use(json({ limit: BODY_LIMIT_BYTES }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT_BYTES }));
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (!isPayloadTooLarge(error)) {
      next(error);
      return;
    }
    const requestId = String(req.id);
    edgeLogger.warn({ requestId }, 'Rejected oversized request body');
    res.status(errorHttpStatusByCode.PAYLOAD_TOO_LARGE).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'The request body is too large.',
        requestId,
      },
    });
  });

  // Filter and interceptor are registered declaratively (CommonModule), so they can inject
  // like any other provider.
  app.enableShutdownHooks();

  // Tenancy precondition (docs/engineering/08 §4, BYPASSRLS warning): a SUPERUSER or BYPASSRLS runtime
  // role makes RLS a silent no-op. Fail at boot rather than serve cross-tenant data that
  // looks correct. This survives the auth teardown deliberately — it inspects role
  // privileges, not tables, so it is valid against an empty database and must be armed
  // BEFORE the tenancy rebuild lands.
  await assertTenancyPrecondition(app);

  await app.listen(ENV.API_PORT, '0.0.0.0');
}

void bootstrap();
