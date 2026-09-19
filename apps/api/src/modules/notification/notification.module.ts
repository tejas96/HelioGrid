import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationPreferencesRepository } from './notification.preferences.repository';
import { NotificationPreferencesService } from './notification.preferences.service';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationPreferencesService,
    NotificationPreferencesRepository,
  ],
})
export class NotificationModule {}
