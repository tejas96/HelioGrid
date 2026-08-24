import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { assertTenancyPrecondition } from './common/db/tenancy-precondition';
import { ENV } from './config/env';

async function bootstrap() {
  // Nest's default body parser is back: `bodyParser: false` plus a manual express.json
  // branch existed ONLY so Better Auth's handler could read the raw stream on /api/auth/*.
  // Auth was removed to greenfield; the rebuild re-adds whatever it needs.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableCors({ origin: ENV.WEB_ORIGIN, credentials: true });
  app.useLogger(app.get(Logger));
  // Filter and interceptor are registered declaratively (CommonModule) — main.ts is
  // bootstrap only, so they can inject like any other provider.
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
