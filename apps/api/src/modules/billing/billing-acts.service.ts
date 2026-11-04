import { BILLING_GATEWAY, type BillingGateway, type CancelRequest } from '@heliogrid/contracts';
import {
  type BillingCycle,
  type CollectionKind,
  type MarketPack,
  refundWindowClosesAt,
  type Tier,
  tierBand,
} from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../../common/errors/contract-exception';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { MarketPackService } from '../market/market.public';
import { CancellationAdminRepository, type OwnerAct } from './cancellation.admin.repository';
import { BillingAlerts } from './internal/billing-alerts';
import { type ProrationRefund, RefundAdminRepository } from './refund.admin.repository';

/**
 * The Owner's two ways out (`M12-50`, `M12-47`). The gateway is asked first and the database moves
 * after, so a gateway that does not answer changes nothing; each gateway call is safe to send
 * again (the port's promise), so a retry after a lost answer finishes the work once.
 */
@Injectable()
export class BillingActsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CancellationAdminRepository)
    private readonly cancellations: CancellationAdminRepository,
    @Inject(RefundAdminRepository) private readonly refunds: RefundAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(OutboxDispatcher) private readonly outbox: OutboxDispatcher,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BillingActsService.name);
  }

  /**
   * `M12-50` — service runs to the paid period end. A mandate is told to raise no debit after it;
   * a payment link needs nothing, since renewals are raised only for `active` rows.
   */
  async cancel(
    tenantId: string,
    request: CancelRequest,
    act: OwnerAct,
  ): Promise<{ runsUntil: string }> {
    const row = await this.cancellations.actedOn(tenantId);
    if (row?.state !== 'active') throw cancelNotPossible();
    const pack = await this.markets.currentPackOf(row.marketCode);
    const { gatewayRef } = row;
    const mandate = collectionOf(pack, row.tier, row.cycle) === 'mandate' ? gatewayRef : null;
    if (mandate !== null) await this.atGateway(() => this.gateway.cancelAtCycleEnd(mandate));
    const runsUntil = await this.cancellations.cancel(
      tenantId,
      row.subscriptionId,
      request.reason,
      act,
    );
    if (runsUntil === null) {
      // The row moved (a charge failed) after the mandate was told to end: the team removes it.
      if (mandate !== null) {
        this.alerts.raise('billing_stray_cancel_schedule', {
          subscriptionId: row.subscriptionId,
          gatewayRef: mandate,
        });
      }
      throw cancelNotPossible();
    }
    return { runsUntil: new Date(runsUntil).toISOString() };
  }

  /**
   * `M12-47` — the first paid cycle, inside its window, goes back to its source in full: the
   * gateway pays it back, the mandate stops now, then the row ends today with the invoice's credit
   * note. An upgrade's part-cycle charge paid inside that cycle goes back with it, under its own
   * credit note. A renewal cycle never refunds: only the company's first payment is ever looked at.
   */
  async refund(tenantId: string, act: OwnerAct): Promise<{ creditNoteNumber: string }> {
    const paid = await this.refunds.firstPaymentOf(tenantId);
    if (paid?.state !== 'active' || act.now >= refundWindowClosesAt(paid.paidAt, paid.timeZone)) {
      throw refundNotPossible();
    }
    const pack = await this.markets.currentPackOf(paid.marketCode);
    const gatewayRefundRef = await this.atGateway(() =>
      this.gateway.refund({
        chargeRef: paid.chargeRef,
        amount: paid.amount,
        reference: paid.invoiceId,
      }),
    );
    // An upgrade paid inside the first cycle is paid back with it, each to its own source.
    const prorations: ProrationRefund[] = [];
    for (const proration of await this.refunds.prorationsOf(tenantId, paid)) {
      const ref = await this.atGateway(() =>
        this.gateway.refund({
          chargeRef: proration.chargeRef,
          amount: proration.amount,
          reference: proration.invoiceId,
        }),
      );
      prorations.push({ invoiceId: proration.invoiceId, gatewayRefundRef: ref });
    }
    const { gatewayRef } = paid;
    if (collectionOf(pack, paid.tier, paid.cycle) === 'mandate' && gatewayRef !== null) {
      await this.atGateway(() => this.gateway.closeCheckout('mandate', gatewayRef));
    }
    const refunded = await this.refunds.record(
      tenantId,
      paid,
      { gatewayRefundRef, pack, prorations },
      act,
    );
    if (refunded === null) throw refundNotPossible();
    for (const eventId of refunded.eventIds) await this.outbox.dispatchNow(eventId);
    return { creditNoteNumber: refunded.creditNoteNumber };
  }

  /** A gateway that does not answer is a 502 with nothing changed; the same call may be sent again. */
  private async atGateway<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logger.warn({ err: error }, 'the billing gateway did not answer');
      throw new ContractException(
        'GATEWAY_UNAVAILABLE',
        'The payment service did not answer. Nothing was changed. Try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

/** How the row's plan is collected, by the market's ladder (`M12-11`); `null` for a trial. */
function collectionOf(
  pack: MarketPack,
  tier: Tier | null,
  cycle: BillingCycle | null,
): CollectionKind | null {
  if (tier === null || cycle === null) return null;
  return pack.paymentRails.ladder[tierBand(tier)][cycle].collection;
}

function cancelNotPossible(): ContractException {
  return new ContractException(
    'CANCEL_NOT_POSSIBLE',
    'Only a plan that is paid up can be cancelled.',
    HttpStatus.CONFLICT,
  );
}

function refundNotPossible(): ContractException {
  return new ContractException(
    'REFUND_NOT_POSSIBLE',
    'A refund is open only in the first 7 days of the first paid cycle.',
    HttpStatus.CONFLICT,
  );
}
