import {
  IDENTITY_PROVIDERS,
  type IdentityProviders,
  MESSAGE_DELIVERY,
  SESSION_RESOLVER,
} from '@heliogrid/contracts';
import { Module } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { MarketModule } from '../market/market.public';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthAdminRepository } from './internal/auth.admin.repository';
import { JoseGoogleIdentity } from './internal/google-identity.jose';
import { TestGoogleIdentity } from './internal/google-identity.test-double';
import { LoginBindingAdminRepository } from './internal/login-binding.admin.repository';
import { DevelopmentMessageDelivery } from './internal/message-delivery.development';
import { OtpAdminRepository } from './internal/otp.admin.repository';
import { OtpService } from './internal/otp.service';
import { SessionResolverService } from './internal/session-resolver.service';
import { TokenService } from './internal/token.service';

/**
 * The front door. Three ports are bound here: `SESSION_RESOLVER`, which the root module's guard
 * depends on, and `MESSAGE_DELIVERY` — the platform rail the code and the invite leave through —
 * bound to the development adapter until the SMS adapter lands, and exported so the invite
 * module sends through the same rail — and `IDENTITY_PROVIDERS`, each sign-in provider's token check and client ids (`M01-02`).
 */
@Module({
  imports: [MarketModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    AuthAdminRepository,
    OtpAdminRepository,
    LoginBindingAdminRepository,
    TokenService,
    {
      provide: IDENTITY_PROVIDERS,
      // The api's own suites cannot hold a real Google login, so under test they sign in through
      // the double — which refuses to be built anywhere else.
      useFactory: (): IdentityProviders => ({
        google: {
          checker: ENV.NODE_ENV === 'test' ? new TestGoogleIdentity() : new JoseGoogleIdentity(),
          audiences: ENV.GOOGLE_CLIENT_IDS,
        },
      }),
    },
    {
      provide: MESSAGE_DELIVERY,
      // The development rail is never bound in production: a boot without the SMS adapter fails
      // here, loudly, rather than serving a front door that whispers codes into a log.
      useFactory: (logger: PinoLogger) => {
        if (ENV.NODE_ENV === 'production') {
          throw new Error(
            'The development message delivery adapter cannot run in production. Wire the SMS adapter.',
          );
        }
        return new DevelopmentMessageDelivery(logger);
      },
      inject: [PinoLogger],
    },
    { provide: SESSION_RESOLVER, useClass: SessionResolverService },
  ],
  exports: [AuthService, MESSAGE_DELIVERY, SESSION_RESOLVER],
})
export class AuthModule {}
