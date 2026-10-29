import { Module } from '@nestjs/common';
import { BillingActivityRegistration } from './billing.activities';
import { BillingAdminRepository } from './billing.admin.repository';
import { BillingService } from './billing.service';

/**
 * Platform billing (`M12`): the subscription lifecycle and its timers. No route yet — the first
 * screen that reads a company's standing declares it.
 */
@Module({
  providers: [BillingService, BillingAdminRepository, BillingActivityRegistration],
  exports: [BillingService],
})
export class BillingModule {}
