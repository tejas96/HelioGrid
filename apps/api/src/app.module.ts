import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.public';

/**
 * Modular monolith root. One Nest module per bounded context (apps/api/CLAUDE.md) — modules
 * land with their tracks: auth, tenancy, crm, survey, design, proposal, customer-link,
 * projects, billing, catalog, agent, notifications, admin.
 *
 * Auth was removed to greenfield on 2026-08-01 (owner ruling) and returns with
 * its rebuild. The deny-by-default APP_GUARD went with it: there is no session to check, so
 * every route here is currently unauthenticated. Restoring the guard is part of that
 * rebuild, NOT something a later module should improvise.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
        redact: {
          // DPDP hygiene: no phone numbers or tokens in logs (apps/api/CLAUDE.md §Local conventions)
          paths: ['req.headers.authorization', 'req.headers.cookie', '*.phone_e164', '*.phoneE164'],
          censor: '[redacted]',
        },
        autoLogging: true,
      },
    }),
    CommonModule,
    HealthModule,
  ],
})
export class AppModule {}
