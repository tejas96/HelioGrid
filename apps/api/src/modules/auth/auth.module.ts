import { OTP_DELIVERY, SESSION_RESOLVER } from '@heliogrid/contracts';
import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.public';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthAdminRepository } from './internal/auth.admin.repository';
import { OtpAdminRepository } from './internal/otp.admin.repository';
import { OtpService } from './internal/otp.service';
import { DevelopmentOtpDelivery } from './internal/otp-delivery.development';
import { SessionResolverService } from './internal/session-resolver.service';
import { TokenService } from './internal/token.service';

/**
 * The front door. Two ports are bound here: `SESSION_RESOLVER`, which the root module's guard
 * depends on, and `OTP_DELIVERY`, bound to the development adapter until the SMS adapter lands.
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
    { provide: OTP_DELIVERY, useClass: DevelopmentOtpDelivery },
    { provide: SESSION_RESOLVER, useClass: SessionResolverService },
  ],
  exports: [AuthService, SESSION_RESOLVER],
})
export class AuthModule {}
