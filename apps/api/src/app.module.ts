import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './modules/health/health.module';

/**
 * Modular monolith root. One Nest module per bounded context (rules/api.md) — modules
 * land with their tracks: auth, tenancy, crm, survey, design, proposal, customer-link,
 * projects, billing, catalog, agent, notifications, admin.
 */
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
        redact: {
          // DPDP hygiene: no phone numbers or tokens in logs (rules/api.md §logging)
          paths: ['req.headers.authorization', 'req.headers.cookie', '*.phone_e164', '*.phoneE164'],
          censor: '[redacted]',
        },
        autoLogging: true,
      },
    }),
    HealthModule,
  ],
})
export class AppModule {}
