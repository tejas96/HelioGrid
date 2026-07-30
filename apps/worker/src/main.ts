import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ENV } from './config/env';
import { WorkerModule } from './worker.module';

/**
 * NestJS standalone application context — no HTTP surface. BullMQ processors register
 * as modules land with their tracks; heavy CPU (shading, Playwright PDF) runs in
 * worker_threads on dedicated machines (apps/worker/CLAUDE.md §What lives here).
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app
    .get(Logger)
    .log(
      ENV.REDIS_URL
        ? 'worker up — BullMQ connected'
        : 'worker up — REDIS_URL unset, queue processors idle (scaffold mode)',
    );
}

void bootstrap();
