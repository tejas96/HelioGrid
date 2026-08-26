import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ENV } from './config/env';
import { WorkerModule } from './worker.module';

/**
 * NestJS standalone application context — no HTTP surface.
 *
 * `enableShutdownHooks()` is load-bearing, not hygiene: it is what turns the SIGTERM a deploy
 * sends into `TemporalWorkerHost.onApplicationShutdown`, which stops polling for new tasks and
 * drains the in-flight ones. Without it the process dies mid-activity, and an activity is
 * exactly where a side effect is half-applied.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app
    .get(Logger)
    .log(
      `worker up — Temporal ${ENV.TEMPORAL_ADDRESS} namespace=${ENV.TEMPORAL_NAMESPACE} ` +
        'queue=heliogrid-platform',
    );
}

void bootstrap();
