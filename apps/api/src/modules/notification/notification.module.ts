import { PUSH_DELIVERY } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { DevelopmentPushDelivery } from './internal/push-delivery.development';
import { FcmPushDelivery } from './internal/push-delivery.fcm';
import { NotificationController } from './notification.controller';
import { PushDeviceAdminRepository } from './notification.devices.admin.repository';
import { NotificationDevicesService } from './notification.devices.service';
import { NotificationPreferencesRepository } from './notification.preferences.repository';
import { NotificationPreferencesService } from './notification.preferences.service';
import { NotificationPushAdminRepository } from './notification.push.admin.repository';
import { NotificationPushService } from './notification.push.service';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';

/**
 * The push rail (`F6-13`). The FCM adapter binds when a service account is configured; without
 * one the development adapter writes what it would have sent to the log, so a machine with no
 * Firebase project still exercises the whole path.
 *
 * Under TEST it never binds, credential or not. A developer's `.env.local` carries a real service
 * account for driving the app by hand, and a suite that picked it up would push invented tokens
 * at Google on every run — a third party called by a test, and a real handset woken by one.
 *
 * Production takes the opposite fallback: a push that only ever reached a log file is worse than
 * one that failed, because nobody would know. The boot refuses instead.
 */
const pushDeliveryProvider: Provider = {
  provide: PUSH_DELIVERY,
  useFactory: (logger: PinoLogger) => {
    const credential = ENV.FCM_SERVICE_ACCOUNT_JSON_BASE64;
    if (credential !== undefined && ENV.NODE_ENV !== 'test') {
      return new FcmPushDelivery(credential, logger);
    }
    if (ENV.NODE_ENV === 'production') {
      throw new Error(
        'No FCM service account. The development push adapter cannot run in production.',
      );
    }
    return new DevelopmentPushDelivery(logger);
  },
  inject: [PinoLogger],
};

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationPreferencesService,
    NotificationPreferencesRepository,
    NotificationDevicesService,
    PushDeviceAdminRepository,
    NotificationPushService,
    NotificationPushAdminRepository,
    pushDeliveryProvider,
  ],
  exports: [NotificationPushService],
})
export class NotificationModule {}
