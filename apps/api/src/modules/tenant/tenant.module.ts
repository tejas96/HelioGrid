import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.public';
import { MarketModule } from '../market/market.public';
import { TenantAdminRepository } from './tenant.admin.repository';
import { TenantController } from './tenant.controller';
import { MyMembershipRepository } from './tenant.my-membership.repository';
import { TenantRepository } from './tenant.repository';
import { TenantService } from './tenant.service';

@Module({
  imports: [AuthModule, MarketModule],
  controllers: [TenantController],
  providers: [TenantService, TenantAdminRepository, TenantRepository, MyMembershipRepository],
  exports: [TenantService],
})
export class TenantModule {}
