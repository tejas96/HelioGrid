import { BILLING_GATEWAY, type BillingGateway, type GatewayCharge } from '@heliogrid/contracts';
import {
  type ChargeFailed,
  type ChargeSucceeded,
  failureMoves,
  successEffect,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MarketPackService } from '../market/market.public';
import { ChargeAdminRepository } from './charge.admin.repository';
import type { Conversion, PlanChangePaid, Renewal } from './collected-on.admin.repository';
import { EntitlementService } from './entitlement.service';
import { BillingAlerts } from './internal/billing-alerts';
import { cycleEnd } from './internal/cycle-end';
import { PlanChangePaidAdminRepository } from './plan-change.paid.admin.repository';

/** A charge no subscription can take: nothing is written, and the reason is named. */
export class ChargeRefused extends Error {
  override readonly name = 'ChargeRefused';
}

/**
 * Charge truth (`M12-09`): the one path every charge fact takes — the gateway's webhook and its
 * reconcile poll alike, so a payment has one writer. A successful charge records its payment and
 * grows the window in one transaction; no late, repeated or older fact moves a subscription back.
 * The charge that pays for a trial's checkout also makes that checkout's plan the row's own, in
 * the same transaction (`M12-54`), and rewrites the company's limits there too (`M12-16`). Every
 * recorded payment issues its invoice there as well (`M12-44`). What each fact does is domain's
 * (`commerce/charges.ts`).
 */
@Injectable()
export class ChargeService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ChargeAdminRepository) private readonly charges: ChargeAdminRepository,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(PlanChangePaidAdminRepository) private readonly upgrades: PlanChangePaidAdminRepository,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChargeService.name);
  }

  /**
   * A charge as the gateway reports it, on its own subscription or payment link. Money the
   * gateway collected that no subscription can take is acknowledged and alerted, never thrown:
   * thrown, the gateway would send it again forever. `refused` was alerted and wrote nothing.
   */
  async recordCollected(
    charge: GatewayCharge,
    now: number,
  ): Promise<'recorded' | 'duplicate' | 'dead' | 'refused'> {
    const on = await this.charges.collectedOn(charge.gatewayRef);
    if (on === null || on.kind === 'stray') {
      this.alerts.raise('billing_charge_refused', {
        reason:
          on === null
            ? 'no subscription or checkout is collected on this reference'
            : 'a hosted page that can convert nothing was paid',
        subscriptionId: on?.subscriptionId ?? null,
        gatewayRef: charge.gatewayRef,
        chargeRef: charge.chargeRef,
      });
      return 'refused';
    }
    if (on.kind === 'plan_change')
      return this.recordUpgradePaid(charge, on.page, on.subscriptionId, now);
    const cycle = on.conversion?.cycle ?? on.cycle;
    // A renewal buys one cycle from the end of the period before it, never from the payment, so a
    // company that pays early loses no day (`M12-09`).
    const paysThrough =
      on.renewal?.paysThrough ??
      charge.paysThrough ??
      (cycle === null ? null : cycleEnd(on.conversion?.startsAt ?? charge.occurredAt, cycle));
    // A converted row always carries its cycle (`subscription_plan_whole`): this is a broken row.
    if (paysThrough === null) throw new Error(`no period to pay for on ${charge.gatewayRef}`);
    try {
      const recorded = await this.recordSuccess(
        {
          subscriptionId: on.subscriptionId,
          chargeRef: charge.chargeRef,
          occurredAt: charge.occurredAt,
          paysThrough,
          amount: charge.amount,
          currencyCode: charge.currencyCode,
        },
        now,
        on.conversion,
        on.renewal,
      );
      if (recorded === 'recorded') await this.afterConversion(on.conversion, on.subscriptionId);
      return recorded;
    } catch (error) {
      if (!(error instanceof ChargeRefused)) throw error;
      this.alerts.raise('billing_charge_refused', {
        reason: error.message,
        gatewayRef: charge.gatewayRef,
        chargeRef: charge.chargeRef,
      });
      return 'refused';
    }
  }

  /**
   * An upgrade's part-cycle page paid (`M12-48`): the row moves to the plan it paid toward in one
   * transaction; then the old mandate is told to end at its cycle, so it never debits the old
   * amount again (`M12-57`). A gateway that does not confirm it is alerted.
   */
  private async recordUpgradePaid(
    charge: GatewayCharge,
    page: PlanChangePaid,
    subscriptionId: string,
    now: number,
  ): Promise<'recorded' | 'duplicate' | 'refused'> {
    const marketCode = await this.charges.marketOf(subscriptionId);
    const pack = marketCode === null ? null : await this.markets.currentPackOf(marketCode);
    const paid =
      pack === null
        ? ({ kind: 'refused', reason: `no subscription ${subscriptionId}` } as const)
        : await this.upgrades.recordPaid({ ...charge, subscriptionId }, page, {
            pack,
            limitsFor: this.entitlements.bookLimitsOf(pack),
            recordedAt: now,
          });
    if (paid.kind === 'refused') {
      this.alerts.raise('billing_charge_refused', {
        reason: paid.reason,
        gatewayRef: charge.gatewayRef,
        chargeRef: charge.chargeRef,
      });
      return 'refused';
    }
    if (paid.kind === 'duplicate') return 'duplicate';
    if (paid.kind === 'moved') {
      await this.payBackMoved(charge, page, subscriptionId);
      return 'refused';
    }
    this.alertIfInvoiceDiffers({ ...charge, subscriptionId }, paid.invoiced);
    if (paid.mandate !== null) await this.endOldMandate(subscriptionId, paid.mandate);
    return 'recorded';
  }

  /**
   * An upgrade page paid after its row left the plan or the period it was priced on buys nothing:
   * the money goes back to its source at once, and the team is told either way — never kept.
   */
  private async payBackMoved(
    charge: GatewayCharge,
    page: PlanChangePaid,
    subscriptionId: string,
  ): Promise<void> {
    let outcome = 'paid back to its source';
    try {
      await this.gateway.refund({
        chargeRef: charge.chargeRef,
        amount: charge.amount,
        reference: page.checkoutId,
      });
    } catch {
      outcome = 'NOT paid back: the gateway did not answer; refund it by hand';
    }
    this.alerts.raise('billing_charge_refused', {
      reason: `an upgrade page was paid after its row moved off the plan or period it was priced on; ${outcome}`,
      subscriptionId,
      gatewayRef: charge.gatewayRef,
      chargeRef: charge.chargeRef,
    });
  }

  private async endOldMandate(subscriptionId: string, gatewayRef: string): Promise<void> {
    try {
      await this.gateway.cancelAtCycleEnd(gatewayRef);
    } catch {
      this.alerts.raise('billing_plan_mandate_open', { subscriptionId, gatewayRef });
    }
  }

  /** What a recorded charge on a hosted page still owes the gateway's side. */
  private async afterConversion(
    conversion: Conversion | null,
    subscriptionId: string,
  ): Promise<void> {
    this.alertIfMandateCancelled(conversion, subscriptionId);
    if (conversion?.reactivates === true) await this.closeOldMandate(subscriptionId);
  }

  /**
   * A reactivated company holds one live mandate (`M12-08`): the dead row's own is cancelled now,
   * so a retry at the gateway can never collect on it. A gateway that does not confirm it is
   * alerted; the new row is already live either way.
   */
  private async closeOldMandate(deadSubscriptionId: string): Promise<void> {
    const mandate = await this.charges.mandateOf(deadSubscriptionId);
    if (mandate === null) return;
    try {
      await this.gateway.closeCheckout('mandate', mandate);
    } catch {
      this.alerts.raise('billing_old_mandate_open', {
        subscriptionId: deadSubscriptionId,
        gatewayRef: mandate,
      });
    }
  }

  /**
   * A mandate's first charge landed while a new pick was cancelling it: the company is paid for
   * this period, and the mandate renews only if the cancel failed. The team reads its status at
   * the gateway before setting up a new one, so the company never holds two live mandates.
   */
  private alertIfMandateCancelled(conversion: Conversion | null, subscriptionId: string): void {
    if (conversion?.collection !== 'mandate' || !conversion.cancelRequested) return;
    this.alerts.raise('billing_cancelled_mandate', {
      subscriptionId,
      checkoutId: conversion.checkoutId,
      gatewayRef: conversion.gatewayRef,
    });
  }

  /**
   * `recorded`: the payment is new and the subscription took it. `duplicate`: the charge was told
   * before, so nothing is written. `dead`: the payment is recorded on a row no charge moves, and
   * an alert is raised — money landed where no charge moves. Either recorded kind issued its
   * invoice; one whose total is not what the gateway collected is alerted, never refused.
   */
  async recordSuccess(
    charge: ChargeSucceeded,
    now: number,
    conversion: Conversion | null = null,
    renewal: Renewal | null = null,
  ): Promise<'recorded' | 'duplicate' | 'dead'> {
    if (charge.amount <= 0) {
      throw new ChargeRefused(`a charge collects an amount above zero, not ${charge.amount}`);
    }
    // The pack is read before the transaction opens, so the limits rewrite (`M12-16`) and the
    // invoice issues (`M12-44`) inside it.
    const marketCode = await this.charges.marketOf(charge.subscriptionId);
    if (marketCode === null) throw new ChargeRefused(`no subscription ${charge.subscriptionId}`);
    const pack = await this.markets.currentPackOf(marketCode);
    const result = await this.charges.recordSuccess(
      charge,
      now,
      (standing) => successEffect(standing, charge, conversion?.reactivates ?? false),
      this.entitlements.bookLimitsOf(pack),
      pack,
      conversion,
      renewal,
    );
    switch (result.kind) {
      case 'unknown subscription':
        throw new ChargeRefused(`no subscription ${charge.subscriptionId}`);
      case 'another currency':
        throw new ChargeRefused(
          `a charge in ${charge.currencyCode} on a company billed in ${result.companyCurrency}`,
        );
      case 'dead':
        this.alertIfInvoiceDiffers(charge, result.invoiced);
        this.alerts.raise('billing_dead_charge', {
          subscriptionId: charge.subscriptionId,
          chargeRef: charge.chargeRef,
        });
        return result.kind;
      case 'recorded':
        this.alertIfInvoiceDiffers(charge, result.invoiced);
        return result.kind;
      case 'duplicate':
        return result.kind;
    }
  }

  /**
   * The invoice states the plan's price; the gateway collected what its plan object or page asked.
   * They part only when the two drifted — a mandate made before the platform registered, say — so
   * the invoice stands and the team looks.
   */
  private alertIfInvoiceDiffers(
    charge: Pick<ChargeSucceeded, 'subscriptionId' | 'chargeRef' | 'amount'>,
    invoiced: number,
  ): void {
    if (invoiced === charge.amount) return;
    this.alerts.raise('billing_invoice_mismatch', {
      subscriptionId: charge.subscriptionId,
      chargeRef: charge.chargeRef,
      collected: charge.amount,
      invoiced,
    });
  }

  /** A failed charge on a gateway ref; `unknown` when nothing is collected on it. */
  async recordFailedOn(
    gatewayRef: string,
    occurredAt: number,
  ): Promise<'moved' | 'stale' | 'unknown'> {
    const on = await this.charges.collectedOn(gatewayRef);
    if (on?.kind !== 'collecting') {
      this.logger.warn({ gatewayRef }, 'a failed charge on a reference nothing is collected on');
      return 'unknown';
    }
    return this.recordFailure({ subscriptionId: on.subscriptionId, occurredAt });
  }

  /**
   * A renewal link unpaid at its due moment (`M12-05`): its invoice fails and the row moves as a
   * failed charge moves it. `moved`: the row is now past due. `stale`: the invoice failed and the
   * row stays where it was. `settled`: the invoice was paid or failed already.
   */
  async recordRenewalUnpaid(renewal: {
    invoiceId: string;
    subscriptionId: string;
    dueAt: number;
  }): Promise<'moved' | 'stale' | 'settled'> {
    const moved = await this.charges.recordRenewalUnpaid(renewal, (standing) =>
      failureMoves(standing, { occurredAt: renewal.dueAt }),
    );
    if (moved === null) return 'settled';
    return moved ? 'moved' : 'stale';
  }

  /** `moved`: the failure made an active subscription past due. `stale`: it changed nothing. */
  async recordFailure(failure: ChargeFailed): Promise<'moved' | 'stale'> {
    const moved = await this.charges.recordFailure(failure, (standing) =>
      failureMoves(standing, failure),
    );
    if (moved === null) throw new ChargeRefused(`no subscription ${failure.subscriptionId}`);
    return moved ? 'moved' : 'stale';
  }
}
