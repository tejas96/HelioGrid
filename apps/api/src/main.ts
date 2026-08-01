import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { assertTenancyPrecondition } from './common/db/tenancy-precondition';
import { ENV } from './config/env';
import { AUTH, type Auth } from './modules/auth/auth.public';

async function bootstrap() {
  // bodyParser off globally: Better Auth's handler must read the raw stream on
  // /api/auth/* (S1 pattern); JSON parsing is re-added for everything else below.
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  app.enableCors({ origin: ENV.WEB_ORIGIN, credentials: true });
  app.useLogger(app.get(Logger));
  // Filter/interceptor/guard are registered declaratively (CommonModule + AppModule's
  // APP_GUARD) — main.ts is bootstrap only, so they can inject like any other provider.
  app.enableShutdownHooks();

  // Tenancy precondition (docs/08 §4, BYPASSRLS warning): a SUPERUSER or BYPASSRLS runtime role makes RLS a
  // silent no-op. Fail at boot rather than serve cross-tenant data that looks correct.
  await assertTenancyPrecondition(app);

  const auth = app.get<Auth>(AUTH);
  const authHandler = toNodeHandler(auth);
  const jsonParser = express.json({ limit: '1mb' });
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.url.startsWith('/api/auth/')) return authHandler(req, res);
    return jsonParser(req, res, next);
  });

  await app.listen(ENV.API_PORT, '0.0.0.0');
}

void bootstrap();
