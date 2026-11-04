import { BILLING_GATEWAY } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { MarketModule } from '../market/market.public';
import { BillingActivityRegistration } from './billing.activities';
import { BillingAdminRepository } from './billing.admin.repository';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingActsService } from './billing-acts.service';
import { BillingHomeController } from './billing-home.controller';
import { BillingHomeRepository } from './billing-home.repository';
import { BillingHomeService } from './billing-home.service';
import { BillingHomeUsageService } from './billing-home.usage.service';
import { BillingRecordsRepository } from './billing-records.repository';
import { BillingRecordsService } from './billing-records.service';
import { BillingStateGuard } from './billing-state.guard';
import { BillingStateRepository } from './billing-state.repository';
import { BillingUsageController } from './billing-usage.controller';
import { BillingUsageService } from './billing-usage.service';
import { CancellationAdminRepository } from './cancellation.admin.repository';
import { ChargeAdminRepository } from './charge.admin.repository';
import { ChargeService } from './charge.service';
import { CheckoutAdminRepository } from './checkout.admin.repository';
import { CheckoutService } from './checkout.service';
import { EntitlementAdminRepository } from './entitlement.admin.repository';
import { EntitlementRepository } from './entitlement.repository';
import { EntitlementService } from './entitlement.service';
import { EntitlementOverrideAdminRepository } from './entitlement-override.admin.repository';
import { GatewayEventAdminRepository } from './gateway-event.admin.repository';
import { GatewayEventsService } from './gateway-events.service';
import { BillingAlerts } from './internal/billing-alerts';
import { DevelopmentBillingGateway } from './internal/billing-gateway.development';
import { RazorpayBillingGateway } from './internal/billing-gateway.razorpay';
import { OtpUsageRepository } from './otp-usage.repository';
import { OtpUsageService } from './otp-usage.service';
import { OverageAdminRepository } from './overage.admin.repository';
import { OverageService } from './overage.service';
import { PlanChangeAdminRepository } from './plan-change.admin.repository';
import { PlanChangeBoundaryAdminRepository } from './plan-change.boundary.admin.repository';
import { PlanChangeBoundaryService } from './plan-change.boundary.service';
import { PlanChangeController } from './plan-change.controller';
import { PlanChangePaidAdminRepository } from './plan-change.paid.admin.repository';
import { PlanChangePreviewService } from './plan-change.preview.service';
import { PlanChangeService } from './plan-change.service';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';
import { PlanPriceService } from './plan-price.service';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { ReconcileAdminRepository } from './reconcile.admin.repository';
import { ReconcileService } from './reconcile.service';
import { RefundAdminRepository } from './refund.admin.repository';
import { RenewalAdminRepository } from './renewal.admin.repository';
import { RenewalService } from './renewal.service';
import { RenewalAdoptionAdminRepository } from './renewal-adoption.admin.repository';
import { UsageActivityRegistration } from './usage.activities';
import { UsageAdminRepository } from './usage.admin.repository';
import { UsageRepository } from './usage.repository';
import { UsageService } from './usage.service';

/**
 * The gateway billing reaches (`M12-03`). The keys bind the market's reference adapter; absent,
 * the development one, so a machine and CI with no gateway account run the whole path.
 *
 * Under TEST it never binds, keys or not: a developer's `.env.local` carries test keys for
 * driving the app by hand, and a suite that picked them up would open real pages at the gateway.
 * Production refuses to boot without the keys: billing that only ever reached a log is worse than
 * none, because nobody would know.
 */
const billingGatewayProvider: Provider = {
  provide: BILLING_GATEWAY,
  useFactory: (logger: PinoLogger) => {
    const keyId = ENV.BILLING_GATEWAY_KEY_ID;
    const keySecret = ENV.BILLING_GATEWAY_KEY_SECRET;
    const webhookSecret = ENV.BILLING_GATEWAY_WEBHOOK_SECRET;
    if (
      keyId !== undefined &&
      keySecret !== undefined &&
      webhookSecret !== undefined &&
      ENV.NODE_ENV !== 'test'
    ) {
      return new RazorpayBillingGateway({ keyId, keySecret, webhookSecret }, logger);
    }
    if (ENV.NODE_ENV === 'production') {
      throw new Error('No billing gateway keys. The development gateway cannot run in production.');
    }
    return new DevelopmentBillingGateway(logger);
  },
  inject: [PinoLogger],
};

/**
 * Platform billing (`M12`): the subscription lifecycle and its timers, charge truth, entitlements,
 * the billing-state gate on every mutation, the hosted checkout a trial converts and a dead row
 * reactivates through, the Owner's billing home, cancel and refund, the gateway's signed messages, the 6-hour
 * reconcile, the yearly renewal on a fresh payment link, the plan screen's upgrade, downgrade
 * and cycle switch, and the usage ledger with its nightly storage gauge.
 */
@Module({
  imports: [MarketModule],
  controllers: [
    BillingController,
    BillingHomeController,
    BillingUsageController,
    PlanChangeController,
    PricingController,
  ],
  providers: [
    billingGatewayProvider,
    BillingActsService,
    BillingAlerts,
    BillingHomeService,
    BillingHomeRepository,
    BillingHomeUsageService,
    BillingUsageService,
    OtpUsageRepository,
    OtpUsageService,
    BillingRecordsRepository,
    BillingRecordsService,
    CancellationAdminRepository,
    RefundAdminRepository,
    BillingService,
    PricingService,
    BillingAdminRepository,
    BillingActivityRegistration,
    RenewalService,
    RenewalAdminRepository,
    RenewalAdoptionAdminRepository,
    BillingStateGuard,
    BillingStateRepository,
    ChargeService,
    ChargeAdminRepository,
    CheckoutService,
    CheckoutAdminRepository,
    EntitlementService,
    EntitlementRepository,
    EntitlementAdminRepository,
    EntitlementOverrideAdminRepository,
    GatewayEventsService,
    GatewayEventAdminRepository,
    PlanChangeService,
    PlanChangePreviewService,
    PlanChangeAdminRepository,
    PlanChangePaidAdminRepository,
    PlanChangeBoundaryService,
    PlanChangeBoundaryAdminRepository,
    PlanPriceService,
    PlanPriceAdminRepository,
    ReconcileService,
    ReconcileAdminRepository,
    OverageService,
    OverageAdminRepository,
    UsageActivityRegistration,
    UsageService,
    UsageRepository,
    UsageAdminRepository,
  ],
  exports: [
    BillingService,
    BillingStateGuard,
    ChargeService,
    EntitlementService,
    OtpUsageService,
    PlanPriceService,
    UsageService,
  ],
})
export class BillingModule {}
