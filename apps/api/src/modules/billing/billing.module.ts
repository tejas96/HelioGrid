import { BILLING_GATEWAY } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { MarketModule } from '../market/market.public';
import { BillingActivityRegistration } from './billing.activities';
import { BillingAdminRepository } from './billing.admin.repository';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingStateGuard } from './billing-state.guard';
import { BillingStateRepository } from './billing-state.repository';
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
import { OverageAdminRepository } from './overage.admin.repository';
import { OverageService } from './overage.service';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';
import { PlanPriceService } from './plan-price.service';
import { ReconcileAdminRepository } from './reconcile.admin.repository';
import { ReconcileService } from './reconcile.service';
import { RenewalAdminRepository } from './renewal.admin.repository';
import { RenewalService } from './renewal.service';
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
 * the billing-state gate on every mutation, the hosted checkout a trial converts through, the gateway's signed messages, the 6-hour
 * reconcile, the yearly renewal on a fresh payment link, and the usage ledger with its nightly
 * storage gauge.
 */
@Module({
  imports: [MarketModule],
  controllers: [BillingController],
  providers: [
    billingGatewayProvider,
    BillingAlerts,
    BillingService,
    BillingAdminRepository,
    BillingActivityRegistration,
    RenewalService,
    RenewalAdminRepository,
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
    PlanPriceService,
    UsageService,
  ],
})
export class BillingModule {}
