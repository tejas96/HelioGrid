import { Module } from '@nestjs/common';
import { SESSION_RESOLVER } from '../../common/tokens';
import { ENV } from '../../config/env';
import { AuthAdminRepository } from './auth.admin.repository';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { createAuth } from './internal/better-auth';
import { createSessionResolver } from './internal/session-resolver';
import { AUTH } from './tokens';

/**
 * The DB pools are provided globally by CommonModule (`common/db/db.providers.ts`) — a
 * feature module never stands up its own connection. This module owns the Better Auth
 * instance, the two repositories, the service, and the SessionResolver port implementation.
 */
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH,
      useFactory: () => createAuth(ENV.DATABASE_ADMIN_URL ?? ENV.DATABASE_URL),
    },
    AuthRepository,
    AuthAdminRepository,
    AuthService,
    // This module IMPLEMENTS the session port that common/'s global guard depends on.
    {
      provide: SESSION_RESOLVER,
      useFactory: createSessionResolver,
      inject: [AUTH, AuthService],
    },
  ],
  exports: [AUTH, SESSION_RESOLVER],
})
export class AuthModule {}
