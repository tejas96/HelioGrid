import { Module } from '@nestjs/common';
import { TsRestModule } from '@ts-rest/nest';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule } from './common/common.module';
import { pinoHttpOptions } from './common/logging';
import { TemporalModule } from './common/temporal/temporal.module';
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
    LoggerModule.forRoot({ pinoHttp: pinoHttpOptions }),
    TsRestModule.register({ isGlobal: true, validateResponses: true }),
    CommonModule,
    TemporalModule,
    HealthModule,
  ],
})
export class AppModule {}
