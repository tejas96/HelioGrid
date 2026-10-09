import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.public';
import { MarketModule } from '../market/market.public';
import { InvitationActivityRegistration } from './invitation.activities';
import { InvitationAdminRepository } from './invitation.admin.repository';
import { InvitationController } from './invitation.controller';
import { InvitationMessageService } from './invitation.message.service';
import { InvitationRepository } from './invitation.repository';
import { InvitationService } from './invitation.service';

/**
 * The team invite (`M01-12`, `M01-13`). Its text leaves through the auth module's message rail
 * from a step the worker's `inviteMessage` run calls after the send commits, and it hands an
 * accepted person to the auth module's session, so the front door stays the one place a session
 * is opened or moved.
 */
@Module({
  imports: [AuthModule, MarketModule],
  controllers: [InvitationController],
  providers: [
    InvitationService,
    InvitationRepository,
    InvitationAdminRepository,
    InvitationMessageService,
    InvitationActivityRegistration,
  ],
})
export class InvitationModule {}
