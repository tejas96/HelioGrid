import { BILLING_GATEWAY } from '@heliogrid/contracts';
import { Module, type Provider } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { MarketModule } from '../market/market.public';
import { BillingActivityRegistration } from './billing.activities';
import { BillingAdminRepository } from './billing.admin.repository';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { ChargeAdminRepository } from './charge.admin.repository';
import { ChargeService } from './charge.service';
import { CheckoutAdminRepository } from './checkout.admin.repository';
import { CheckoutService } from './checkout.service';
import { GatewayEventAdminRepository } from './gateway-event.admin.repository';
import { GatewayEventsService } from './gateway-events.service';
import { BillingAlerts } from './internal/billing-alerts';
import { DevelopmentBillingGateway } from './internal/billing-gateway.development';
import { RazorpayBillingGateway } from './internal/billing-gateway.razorpay';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';
import { PlanPriceService } from './plan-price.service';
import { ReconcileAdminRepository } from './reconcile.admin.repository';
import { ReconcileService } from './reconcile.service';

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
 * Platform billing (`M12`): the subscription lifecycle and its timers, charge truth, the hosted
 * checkout a trial converts through, the gateway's signed messages and the 6-hour reconcile.
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
    ChargeService,
    ChargeAdminRepository,
    CheckoutService,
    CheckoutAdminRepository,
    GatewayEventsService,
    GatewayEventAdminRepository,
    PlanPriceService,
    PlanPriceAdminRepository,
    ReconcileService,
    ReconcileAdminRepository,
  ],
  exports: [BillingService, ChargeService, PlanPriceService],
})
export class BillingModule {}
