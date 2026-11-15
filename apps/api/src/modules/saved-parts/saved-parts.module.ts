import { Module } from '@nestjs/common';
import { SavedPartsController } from './saved-parts.controller';
import { SavedPartsRepository } from './saved-parts.repository';
import { SavedPartsService } from './saved-parts.service';

/** The company's saved cable, electrical and structure parts (`M06-28`, `T-M06-034`). */
@Module({
  controllers: [SavedPartsController],
  providers: [SavedPartsService, SavedPartsRepository],
})
export class SavedPartsModule {}
