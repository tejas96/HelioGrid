import { createDb } from '@heliogrid/db';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createAuth } from './better-auth';
import { SessionGuard } from './claims';
import { ADMIN_DB, AUTH, RUNTIME_DB } from './tokens';

/**
 * Two pools by design (rules/api.md tenancy): RUNTIME_DB logs in as a member of
 * app_user (RLS-subject — the backstop is live in dev, not just prod); ADMIN_DB is the
 * explicit elevated path for signup/accept-invite/guard-resolution only.
 */
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH,
      useFactory: () =>
        createAuth(process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL ?? ''),
    },
    {
      provide: RUNTIME_DB,
      useFactory: () => createDb(process.env.DATABASE_URL ?? '', { max: 10 }).db,
    },
    {
      provide: ADMIN_DB,
      useFactory: () =>
        createDb(process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL ?? '', { max: 5 }).db,
    },
    AuthService,
    {
      provide: 'CLAIMS_RESOLVER',
      useFactory: (service: AuthService) => (userId: string) => service.resolveTenant(userId),
      inject: [AuthService],
    },
    SessionGuard,
  ],
  exports: [AUTH, SessionGuard, 'CLAIMS_RESOLVER'],
})
export class AuthModule {}
