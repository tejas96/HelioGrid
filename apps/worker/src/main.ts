import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { WorkerModule } from './worker.module';

/**
 * NestJS standalone application context — no HTTP surface. BullMQ processors register
 * as modules land with their tracks; heavy CPU (shading, Playwright PDF) runs in
 * worker_threads on dedicated machines (rules/api.md §jobs).
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app
    .get(Logger)
    .log(
      process.env.REDIS_URL
        ? 'worker up — BullMQ connected'
        : 'worker up — REDIS_URL unset, queue processors idle (scaffold mode)',
    );
}

void bootstrap();
