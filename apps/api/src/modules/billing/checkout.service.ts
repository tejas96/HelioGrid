import {
  BILLING_GATEWAY,
  type BillingGateway,
  type CheckoutOpened,
  type CheckoutRequest,
} from '@heliogrid/contracts';
import { listedPrice, tierBand } from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackService } from '../market/market.public';
import { ChargeService } from './charge.service';
import {
  CheckoutAdminRepository,
  type CheckoutStanding,
  type OpenCheckout,
} from './checkout.admin.repository';
import { PlanPriceAdminRepository } from './plan-price.admin.repository';

/**
 * Conversion's first half (`M12-54`): a trial picks a tier and a cycle, and the gateway's hosted
 * page opens on the rail the market's ladder names for it (`M12-11`). The company stays `trialing`
 * with everything it had until the gateway says the page was paid; the charge path then makes the
 * plan the row's own. One open page per subscription, so two can never both collect.
 */
@Injectable()
export class CheckoutService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CheckoutAdminRepository) private readonly checkouts: CheckoutAdminRepository,
    @Inject(PlanPriceAdminRepository) private readonly prices: PlanPriceAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(ChargeService) private readonly charges: ChargeService,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CheckoutService.name);
  }

  async open(tenantId: string, request: CheckoutRequest, now: number): Promise<CheckoutOpened> {
    const standing = trialing(await this.checkouts.standingOf(tenantId), now);
    const pack = await this.markets.currentPackOf(standing.marketCode);
    if (listedPrice(pack.priceBook, request.tier, request.cycle) === null) {
      throw new ContractException(
        'TIER_NOT_SOLD',
        'That plan is not sold on that cycle here. Enterprise is arranged with our team.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const price = await this.prices.current({
      marketCode: standing.marketCode,
      tier: request.tier,
      cycle: request.cycle,
      currencyCode: standing.currencyCode,
    });
    // The book sells it, so the publish command wrote its plan price: a missing row is a broken
    // deployment, said loudly and never guessed around.
    if (price === null) {
      throw new Error(
        `no plan price for ${request.tier} ${request.cycle} in ${standing.marketCode}`,
      );
    }
    const open = await this.checkouts.openOf(tenantId, standing.subscriptionId);
    if (open?.planPriceId === price.id && !open.cancelRequested) {
      return { checkoutUrl: open.hostedUrl };
    }
    if (open !== null) await this.closeUnpaid(tenantId, open, now);
    const route = pack.paymentRails.ladder[tierBand(request.tier)][request.cycle];
    const id = this.checkouts.newId();
    // The trial's end: no page opened in the trial takes money after it (`M12-54`).
    const expiresAt = standing.trialEndsAt ?? now;
    const opened = await this.atGateway(() =>
      this.gateway.openCheckout({
        route,
        gatewayPlanRef: price.gatewayPlanRef,
        amount: price.collectedMinor,
        currencyCode: price.currencyCode,
        checkoutId: id,
        expiresAt,
      }),
    );
    const kept = await this.checkouts.insert({
      id,
      tenantId,
      subscriptionId: standing.subscriptionId,
      planPriceId: price.id,
      collection: route.collection,
      gatewayRef: opened.gatewayRef,
      hostedUrl: opened.hostedUrl,
      expiresAt,
      openedAt: now,
    });
    if (!kept) {
      // Another request opened its page at the same moment: this one must take no money. The
      // same pick then answers that page, as a repeat does; a different one is refused.
      await this.atGateway(() => this.gateway.closeCheckout(route.collection, opened.gatewayRef));
      const winner = await this.checkouts.openOf(tenantId, standing.subscriptionId);
      if (winner?.planPriceId === price.id) return { checkoutUrl: winner.hostedUrl };
      throw notPossible('Another checkout opened at the same moment. Try again.');
    }
    return { checkoutUrl: opened.hostedUrl };
  }

  /**
   * Closes the open page before a new pick opens one — unless the gateway took money on it: that
   * charge goes through the charge path, which converts the company on the plan it paid for, and
   * the new pick is refused. A paid page is never closed, so a company can never pay two
   * (`M12-09`). The gateway is asked again after the cancel, while the row is still open, so a
   * payment made in between still converts; a row a charge closed first refuses the pick. The
   * cancel is safe to send again (the port's promise), so a lost answer is fixed by a retry.
   */
  private async closeUnpaid(tenantId: string, open: OpenCheckout, now: number): Promise<void> {
    await this.refuseIfPaid(open, now);
    await this.checkouts.cancelRequested(tenantId, open.id, now);
    await this.atGateway(() => this.gateway.closeCheckout(open.collection, open.gatewayRef));
    await this.refuseIfPaid(open, now);
    if (!(await this.checkouts.close(tenantId, open.id, now))) {
      throw notPossible('Your payment on the plan you picked is being confirmed.');
    }
  }

  /**
   * Money the gateway collected on the page goes through the charge path. Only money the path
   * took refuses the new pick: a charge it refused (alerted there) belongs to no plan, and leaves
   * the page to be closed, so the company is never stuck on it.
   */
  private async refuseIfPaid(open: OpenCheckout, now: number): Promise<void> {
    const collected = await this.atGateway(() =>
      this.gateway.chargesOn(open.collection, open.gatewayRef),
    );
    let taken = false;
    for (const charge of collected) {
      if ((await this.charges.recordCollected(charge, now)) !== 'refused') taken = true;
    }
    if (taken) throw notPossible('Your payment on the plan you picked is being confirmed.');
  }

  /** A gateway that does not answer is a 502 with nothing changed; the same call may be sent again. */
  private async atGateway<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logger.warn({ err: error }, 'the billing gateway did not answer');
      throw new ContractException(
        'GATEWAY_UNAVAILABLE',
        'The payment service did not answer. Nothing was charged. Try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

/** Conversion starts from a running trial; paying from a lapsed state is reactivation (`M12-08`). */
function trialing(standing: CheckoutStanding | null, now: number): CheckoutStanding {
  if (standing?.state !== 'trialing' || (standing.trialEndsAt ?? now) <= now) {
    throw notPossible('Only a company on its trial can start a plan here.');
  }
  return standing;
}

function notPossible(message: string): ContractException {
  return new ContractException('CHECKOUT_NOT_POSSIBLE', message, HttpStatus.CONFLICT);
}
