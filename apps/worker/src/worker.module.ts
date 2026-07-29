import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ENV } from './config/env';

/**
 * BullMQ wiring (docs/03 §7, binding): Upstash fixed plan over TCP/RESP,
 * `maxRetriesPerRequest: null`, eviction OFF on the server side — never enable it.
 * Queues register per module; repeatable jobs own the time-based product rules.
 */
const bullImports = ENV.REDIS_URL
  ? [
      BullModule.forRoot({
        connection: {
          url: ENV.REDIS_URL,
          maxRetriesPerRequest: null,
        },
        prefix: 'heliogrid',
      }),
    ]
  : [];

@Module({
  imports: [LoggerModule.forRoot(), ...bullImports],
})
export class WorkerModule {}
