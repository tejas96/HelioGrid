import { MESSAGE_DELIVERY, SESSION_RESOLVER } from '@heliogrid/contracts';
import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.public';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthAdminRepository } from './internal/auth.admin.repository';
import { DevelopmentMessageDelivery } from './internal/message-delivery.development';
import { OtpAdminRepository } from './internal/otp.admin.repository';
import { OtpService } from './internal/otp.service';
import { SessionResolverService } from './internal/session-resolver.service';
import { TokenService } from './internal/token.service';

/**
 * The front door. Two ports are bound here: `SESSION_RESOLVER`, which the root module's guard
 * depends on, and `MESSAGE_DELIVERY` — the platform rail the code and the invite leave through —
 * bound to the development adapter until the SMS adapter lands, and exported so the invite
 * module sends through the same rail.
 */
@Module({
  imports: [MarketModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    AuthAdminRepository,
    OtpAdminRepository,
    TokenService,
    { provide: MESSAGE_DELIVERY, useClass: DevelopmentMessageDelivery },
    { provide: SESSION_RESOLVER, useClass: SessionResolverService },
  ],
  exports: [AuthService, MESSAGE_DELIVERY, SESSION_RESOLVER],
})
export class AuthModule {}
