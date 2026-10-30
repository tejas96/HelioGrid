import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.public';
import { MarketModule } from '../market/market.public';
import { NotificationModule } from '../notification/notification.public';
import { SettingsModule } from '../settings/settings.public';
import { BillingNoticeActivityRegistration } from './billing-notice.activities';
import { BillingNoticeAdminRepository } from './billing-notice.admin.repository';
import { BillingNoticeService } from './billing-notice.service';
import { BillingNoticeCandidatesAdminRepository } from './billing-notice-candidates.admin.repository';

/**
 * The billing notices (`M12-39`–`M12-42`): the dunning ladder and the trial nudges, told in the
 * app, by push and by the market's SMS text.
 *
 * A module of its own beside `BillingModule`, not inside it: the notices need `SettingsModule`
 * for a company's quiet window, and Settings → File → Billing would close an import cycle. Nothing
 * but `AppModule` imports this one; the charge clears notices through `clearOpenNotices`, a
 * function on the charge's own transaction.
 */
@Module({
  imports: [AuthModule, MarketModule, NotificationModule, SettingsModule],
  providers: [
    BillingNoticeService,
    BillingNoticeAdminRepository,
    BillingNoticeCandidatesAdminRepository,
    BillingNoticeActivityRegistration,
  ],
})
export class BillingNoticeModule {}
