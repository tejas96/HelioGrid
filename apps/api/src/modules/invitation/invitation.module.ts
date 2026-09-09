import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.public';
import { MarketModule } from '../market/market.public';
import { InvitationAdminRepository } from './invitation.admin.repository';
import { InvitationController } from './invitation.controller';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';

/**
 * The team invite (`M01-12`, `M01-13`). It sends through the auth module's message rail and
 * hands an accepted person to the auth module's session, so the front door stays the one place
 * a session is opened or moved.
 */
@Module({
  imports: [AuthModule, MarketModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository, InvitationAdminRepository],
})
export class InvitationModule {}
