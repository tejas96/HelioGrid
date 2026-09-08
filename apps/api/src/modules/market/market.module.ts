import { Module } from '@nestjs/common';
import { MarketPackAdminRepository } from './market.admin.repository';
import { MarketPackController } from './market.controller';
import { MarketPackRepository } from './market.repository';
import { MarketPackService } from './market.service';

@Module({
  controllers: [MarketPackController],
  providers: [MarketPackService, MarketPackRepository, MarketPackAdminRepository],
  exports: [MarketPackService],
})
export class MarketModule {}
