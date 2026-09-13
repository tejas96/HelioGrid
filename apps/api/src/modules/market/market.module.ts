import { Module } from '@nestjs/common';
import { MarketPackAdminRepository } from './market.admin.repository';
import { MarketPackController } from './market.controller';
import { MarketPackReferenceRepository } from './market.reference.repository';
import { MarketPackService } from './market.service';

@Module({
  controllers: [MarketPackController],
  providers: [MarketPackService, MarketPackReferenceRepository, MarketPackAdminRepository],
  exports: [MarketPackService],
})
export class MarketModule {}
