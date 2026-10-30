import { Module } from '@nestjs/common';
import { BillingActivityRegistration } from './billing.activities';
import { BillingAdminRepository } from './billing.admin.repository';
import { BillingService } from './billing.service';
import { ChargeAdminRepository } from './charge.admin.repository';
import { ChargeService } from './charge.service';

/**
 * Platform billing (`M12`): the subscription lifecycle, its timers and charge truth. No route yet
 * — the first screen that reads a company's standing declares it, and the gateway's webhook
 * (T-M12-007) calls `ChargeService`.
 */
@Module({
  providers: [
    BillingService,
    BillingAdminRepository,
    BillingActivityRegistration,
    ChargeService,
    ChargeAdminRepository,
  ],
  exports: [BillingService, ChargeService],
})
export class BillingModule {}
