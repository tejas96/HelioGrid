import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule } from './common/common.module';
import { SessionGuard } from './common/guards/session.guard';
import { AuthModule } from './modules/auth/auth.public';
import { HealthModule } from './modules/health/health.public';

/**
 * Modular monolith root. One Nest module per bounded context (apps/api/CLAUDE.md) — modules
 * land with their tracks: auth, tenancy, crm, survey, design, proposal, customer-link,
 * projects, billing, catalog, agent, notifications, admin.
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
    AuthModule,
  ],
  providers: [
    /*
     * DENY BY DEFAULT. Every route is authenticated unless it carries `@Public()` — a new
     * controller can no longer ship unauthenticated by forgetting `@UseGuards`.
     * Bound HERE, not in CommonModule: the guard needs SESSION_RESOLVER from AuthModule, and
     * `common/` may never import a module. AppModule is the one place that sees both.
     */
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
