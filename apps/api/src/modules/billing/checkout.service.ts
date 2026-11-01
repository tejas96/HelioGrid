import {
  BILLING_GATEWAY,
  type BillingGateway,
  type CheckoutOpened,
  type CheckoutRequest,
} from '@heliogrid/contracts';
import {
  type BillingState,
  listedPrice,
  reactivationPageExpiresAt,
  tierBand,
} from '@heliogrid/domain';
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
 * Conversion's and reactivation's first half (`M12-54`, `M12-08`): a trial, or a dead row, picks a
 * tier and a cycle, and the gateway's hosted page opens on the rail the market's ladder names for
 * it (`M12-11`). A trial stays `trialing` with everything it had until the gateway says the page
 * was paid; the charge path then makes the plan the row's own — or, on a dead row, starts a new
 * row with it. One open page per subscription, so two can never both collect.
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

  async open(
    tenantId: string,
    request: CheckoutRequest,
    act: { readonly actorUserId: string; readonly now: number },
  ): Promise<CheckoutOpened> {
    const { now } = act;
    const standing = await this.checkouts.standingOf(tenantId);
    const window = pageWindowOf(standing, now);
    const pack = await this.markets.currentPackOf(window.standing.marketCode);
    if (listedPrice(pack.priceBook, request.tier, request.cycle) === null) {
      throw new ContractException(
        'TIER_NOT_SOLD',
        'That plan is not sold on that cycle here. Enterprise is arranged with our team.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    const price = await this.prices.current({
      marketCode: window.standing.marketCode,
      tier: request.tier,
      cycle: request.cycle,
      currencyCode: window.standing.currencyCode,
    });
    // The book sells it, so the publish command wrote its plan price: a missing row is a broken
    // deployment, said loudly and never guessed around.
    if (price === null) {
      throw new Error(
        `no plan price for ${request.tier} ${request.cycle} in ${window.standing.marketCode}`,
      );
    }
    const { subscriptionId } = window.standing;
    const open = await this.checkouts.openOf(tenantId, subscriptionId);
    // A page past its expiry takes no money — a trial's page left unpaid when the trial ended —
    // so it is closed like any other and a new one opens.
    if (open?.planPriceId === price.id && !open.cancelRequested && open.expiresAt > now) {
      return { checkoutUrl: open.hostedUrl };
    }
    if (open !== null) await this.closeUnpaid(tenantId, open, now);
    const route = pack.paymentRails.ladder[tierBand(request.tier)][request.cycle];
    const id = this.checkouts.newId();
    const { expiresAt, startsAt } = window;
    const opened = await this.atGateway(() =>
      this.gateway.openCheckout({
        route,
        gatewayPlanRef: price.gatewayPlanRef,
        amount: price.collectedMinor,
        currencyCode: price.currencyCode,
        reference: id,
        expiresAt: window.gatewayExpiresAt,
        startsAt,
      }),
    );
    const kept = await this.checkouts.insert({
      id,
      tenantId,
      subscriptionId,
      planPriceId: price.id,
      collection: route.collection,
      gatewayRef: opened.gatewayRef,
      hostedUrl: opened.hostedUrl,
      expiresAt,
      startsAt,
      openedAt: now,
      openedBy: act.actorUserId,
    });
    if (!kept) {
      // Another request opened its page at the same moment: this one must take no money. The
      // same pick then answers that page, as a repeat does; a different one is refused.
      await this.atGateway(() => this.gateway.closeCheckout(route.collection, opened.gatewayRef));
      const winner = await this.checkouts.openOf(tenantId, subscriptionId);
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

/** When a page may take money, and where the period it buys begins. */
interface PageWindow {
  readonly standing: CheckoutStanding;
  /** Until when the page is ours to hand out again. */
  readonly expiresAt: number;
  /** Until when the gateway takes an approval on it. */
  readonly gatewayExpiresAt: number;
  readonly startsAt: number | null;
}

/**
 * A running trial converts: its page takes no money after the trial ends (`M12-54`). A dead row
 * reactivates (`M12-08`): its page stays open for a day — but a cancelled row still running opens
 * one that stays open until its period ends, where its new period begins, so no day is paid twice.
 * A live row past its trial has nothing to buy here.
 */
function pageWindowOf(standing: CheckoutStanding | null, now: number): PageWindow {
  if (standing?.state === 'trialing' && (standing.trialEndsAt ?? now) > now) {
    const trialEnd = standing.trialEndsAt ?? now;
    return { standing, expiresAt: trialEnd, gatewayExpiresAt: trialEnd, startsAt: null };
  }
  if (standing !== null && DEAD.has(standing.state)) {
    const running = standing.state === 'cancelled' && (standing.paidPeriodEnd ?? now) > now;
    // A running row's page stays open until its period ends, where its first debit waits: closed
    // for age before then, a second press would cancel the mandate the Owner already approved.
    // The gateway stops taking an approval at the period end; here the page is kept a day past it,
    // until its first debit's charge lands, so a press in that gap answers the same page.
    return running && standing.paidPeriodEnd !== null
      ? {
          standing,
          expiresAt: reactivationPageExpiresAt(standing.paidPeriodEnd),
          gatewayExpiresAt: standing.paidPeriodEnd,
          startsAt: standing.paidPeriodEnd,
        }
      : {
          standing,
          expiresAt: reactivationPageExpiresAt(now),
          gatewayExpiresAt: reactivationPageExpiresAt(now),
          startsAt: null,
        };
  }
  throw notPossible('This company already holds a plan. Change it from the plan screen.');
}

const DEAD: ReadonlySet<BillingState> = new Set(['halted', 'expired', 'cancelled']);

function notPossible(message: string): ContractException {
  return new ContractException('CHECKOUT_NOT_POSSIBLE', message, HttpStatus.CONFLICT);
}
