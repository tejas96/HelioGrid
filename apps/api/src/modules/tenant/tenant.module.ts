import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.public';
import { MarketModule } from '../market/market.public';
import { NotificationModule } from '../notification/notification.public';
import { SettingsModule } from '../settings/settings.public';
import { TenantAdminRepository } from './tenant.admin.repository';
import { TenantController } from './tenant.controller';
import { JoinRequestRepository } from './tenant.join-request.repository';
import { JoinRequestService } from './tenant.join-request.service';
import { MyMembershipRepository } from './tenant.my-membership.repository';
import { TenantRepository } from './tenant.repository';
import { TenantService } from './tenant.service';

@Module({
  imports: [AuthModule, MarketModule, NotificationModule, SettingsModule],
  controllers: [TenantController],
  providers: [
    TenantService,
    JoinRequestService,
    TenantAdminRepository,
    TenantRepository,
    MyMembershipRepository,
    JoinRequestRepository,
  ],
  exports: [TenantService],
})
export class TenantModule {}
