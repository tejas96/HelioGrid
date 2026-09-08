import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TsRestModule } from '@ts-rest/nest';
import { LoggerModule } from 'nestjs-pino';
import { SessionGuard } from './common/auth/session.guard';
import { CommonModule } from './common/common.module';
import { pinoHttpOptions } from './common/logging';
import { TemporalModule } from './common/temporal/temporal.module';
import { AuthModule } from './modules/auth/auth.public';
import { HealthModule } from './modules/health/health.public';
import { MarketModule } from './modules/market/market.public';
import { TenantModule } from './modules/tenant/tenant.public';
import { UserModule } from './modules/user/user.public';

/**
 * Modular monolith root. One Nest module per bounded context (apps/api/CLAUDE.md) — health,
 * the market pack, auth, tenant and user today; the rest land with their slices: crm, survey,
 * design, proposal, customer-link, projects, billing, catalog, agent, notifications, admin.
 *
 * The deny-by-default guard is bound HERE, as APP_GUARD, because this is the one module that
 * imports both `common/` (the guard) and the auth module (the `SessionResolver` it depends on);
 * declared in CommonModule it would fail at boot in that module's injector.
 */
@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: pinoHttpOptions }),
    TsRestModule.register({ isGlobal: true, validateResponses: true }),
    CommonModule,
    TemporalModule,
    HealthModule,
    MarketModule,
    AuthModule,
    TenantModule,
    UserModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
