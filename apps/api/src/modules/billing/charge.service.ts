import type { GatewayCharge } from '@heliogrid/contracts';
import {
  type ChargeFailed,
  type ChargeSucceeded,
  failureMoves,
  successEffect,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChargeAdminRepository, type Conversion } from './charge.admin.repository';
import { BillingAlerts } from './internal/billing-alerts';
import { cycleEnd } from './internal/cycle-end';

/** A charge no subscription can take: nothing is written, and the reason is named. */
export class ChargeRefused extends Error {
  override readonly name = 'ChargeRefused';
}

/**
 * Charge truth (`M12-09`): the one path every charge fact takes — the gateway's webhook and its
 * reconcile poll alike, so a payment has one writer. A successful charge records its payment and
 * grows the window in one transaction; no late, repeated or older fact moves a subscription back.
 * The charge that pays for a trial's checkout also makes that checkout's plan the row's own, in
 * the same transaction (`M12-54`). What each fact does is domain's (`commerce/charges.ts`).
 */
@Injectable()
export class ChargeService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ChargeAdminRepository) private readonly charges: ChargeAdminRepository,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
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
    const cycle = on.conversion?.cycle ?? on.cycle;
    const paysThrough =
      charge.paysThrough ?? (cycle === null ? null : cycleEnd(charge.occurredAt, cycle));
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
      );
      if (recorded === 'recorded') this.alertIfMandateCancelled(on.conversion, on.subscriptionId);
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
   * an alert is raised — money landed where no charge moves.
   */
  async recordSuccess(
    charge: ChargeSucceeded,
    now: number,
    conversion: Conversion | null = null,
  ): Promise<'recorded' | 'duplicate' | 'dead'> {
    if (charge.amount <= 0) {
      throw new ChargeRefused(`a charge collects an amount above zero, not ${charge.amount}`);
    }
    const result = await this.charges.recordSuccess(
      charge,
      now,
      (standing) => successEffect(standing, charge),
      conversion,
    );
    switch (result.kind) {
      case 'unknown subscription':
        throw new ChargeRefused(`no subscription ${charge.subscriptionId}`);
      case 'another currency':
        throw new ChargeRefused(
          `a charge in ${charge.currencyCode} on a company billed in ${result.companyCurrency}`,
        );
      case 'dead':
        this.alerts.raise('billing_dead_charge', {
          subscriptionId: charge.subscriptionId,
          chargeRef: charge.chargeRef,
        });
        return result.kind;
      default:
        return result.kind;
    }
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

  /** `moved`: the failure made an active subscription past due. `stale`: it changed nothing. */
  async recordFailure(failure: ChargeFailed): Promise<'moved' | 'stale'> {
    const moved = await this.charges.recordFailure(failure, (standing) =>
      failureMoves(standing, failure),
    );
    if (moved === null) throw new ChargeRefused(`no subscription ${failure.subscriptionId}`);
    return moved ? 'moved' : 'stale';
  }
}
