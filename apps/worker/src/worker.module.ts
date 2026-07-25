import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

/**
 * BullMQ wiring (docs/03 §7, binding): Upstash fixed plan over TCP/RESP,
 * `maxRetriesPerRequest: null`, eviction OFF on the server side — never enable it.
 * Queues register per module; repeatable jobs own the time-based product rules.
 */
const bullImports = process.env.REDIS_URL
  ? [
      BullModule.forRoot({
        connection: {
          url: process.env.REDIS_URL,
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
