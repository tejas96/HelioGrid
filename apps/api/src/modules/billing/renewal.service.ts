import { BILLING_GATEWAY, type BillingGateway } from '@heliogrid/contracts';
import { collectionRoute, type MarketPack, tierBand } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MarketPackService } from '../market/market.public';
import { ChargeService } from './charge.service';
import { BillingAlerts } from './internal/billing-alerts';
import { cycleEnd } from './internal/cycle-end';
import { renewalDueAt, renewalLinkExpiresAt } from './internal/renewal-moments';
import {
  RenewalAdminRepository,
  type RenewalCursor,
  type RenewalDue,
} from './renewal.admin.repository';

/**
 * Renewals raised per run. Each opens one link, at most the gateway's 10 s call timeout, so a full
 * batch ends well inside the overage step's 10-minute timeout.
 */
const RAISE_BATCH = 25;

/** Unpaid renewals failed per timers run: each is one transaction, no gateway call. */
const FAIL_BATCH = 100;

/**
 * The renewal of a company a payment link collects (`M12-11`, `F1-40`: every IN yearly tier): once
 * its paid period closes, a fresh link and its `issued` invoice for the next period — the plan
 * and the closed period's overage. Its charge lands through the charge path; left unpaid at its due
 * moment, it is a failed charge (`M12-05`).
 */
@Injectable()
export class RenewalService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(RenewalAdminRepository) private readonly renewals: RenewalAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(ChargeService) private readonly charges: ChargeService,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RenewalService.name);
  }

  /**
   * The overage step's last part: every renewal due, raised; answers how many were. A row the
   * pack no longer sells by link costs no gateway call and is read past, so it never holds the
   * queue; the run stops after `RAISE_BATCH` gateway calls or at the queue's end.
   */
  async raiseDue(now: number): Promise<number> {
    const packs = new Map<string, MarketPack>();
    let raised = 0;
    let calls = 0;
    let after: RenewalCursor | null = null;
    while (calls < RAISE_BATCH) {
      const page = await this.renewals.due(now, RAISE_BATCH, after);
      for (const due of page) {
        if (calls >= RAISE_BATCH) break;
        const pack =
          packs.get(due.marketCode) ?? (await this.markets.currentPackOf(due.marketCode));
        packs.set(due.marketCode, pack);
        const outcome = await this.raise(due, pack, now);
        if (outcome !== 'not by link') calls += 1;
        if (outcome === 'raised') raised += 1;
        after = due;
      }
      if (page.length < RAISE_BATCH) break;
    }
    return raised;
  }

  /**
   * The timers' part: every renewal unpaid at its due moment failed, and every row past that moment
   * with no renewal raised failed as well — alerted, since its link never went out. Answers how
   * many rows moved.
   */
  async failUnpaid(now: number): Promise<number> {
    let moved = 0;
    for (const unpaid of await this.renewals.unpaid(now, FAIL_BATCH)) {
      if ((await this.charges.recordRenewalUnpaid(unpaid)) === 'moved') moved += 1;
    }
    for (const unraised of await this.renewals.unraised(now, FAIL_BATCH)) {
      this.alerts.raise('billing_renewal_not_raised', { subscriptionId: unraised.subscriptionId });
      const failure = {
        subscriptionId: unraised.subscriptionId,
        occurredAt: renewalDueAt(unraised.paidPeriodEnd),
      };
      if ((await this.charges.recordFailure(failure)) === 'moved') moved += 1;
    }
    return moved;
  }

  /**
   * One renewal: the invoice worked out, the link opened for its total, then the invoice issued
   * with it. A link whose invoice could not be issued is closed, so it takes no money; one the
   * gateway may still hold open is alerted. A gateway that does not answer is tried next run.
   */
  private async raise(
    due: RenewalDue,
    pack: MarketPack,
    now: number,
  ): Promise<'raised' | 'not raised' | 'not by link'> {
    const route = collectionRoute(pack.paymentRails, tierBand(due.tier), due.cycle);
    // The pack moved this tier onto a mandate since conversion: that rail's re-pick is the owner's.
    if (route.collection !== 'invoice') return 'not by link';
    const invoiceId = this.renewals.newId();
    const draft = await this.renewals.draft({
      tenantId: due.tenantId,
      subscriptionId: due.subscriptionId,
      planPriceId: due.planPriceId,
      paysThrough: cycleEnd(due.paidPeriodEnd, due.cycle),
      issuedAt: now,
      pack,
    });
    let opened: Awaited<ReturnType<BillingGateway['openCheckout']>>;
    try {
      opened = await this.gateway.openCheckout({
        route,
        gatewayPlanRef: due.gatewayPlanRef,
        amount: draft.total,
        currencyCode: due.currencyCode,
        reference: invoiceId,
        expiresAt: renewalLinkExpiresAt(due.paidPeriodEnd),
      });
    } catch (error) {
      this.logger.warn(
        { err: error, subscriptionId: due.subscriptionId },
        'no renewal link; next run',
      );
      return 'not raised';
    }
    const link = {
      invoiceId,
      gatewayRef: opened.gatewayRef,
      hostedUrl: opened.hostedUrl,
      dueAt: renewalDueAt(due.paidPeriodEnd),
    };
    try {
      if ((await this.renewals.issue(draft, link)) === 'issued') return 'raised';
    } catch (error) {
      this.logger.error({ err: error, subscriptionId: due.subscriptionId }, 'renewal not issued');
    }
    await this.closeUnissued(due, opened.gatewayRef);
    return 'not raised';
  }

  private async closeUnissued(due: RenewalDue, gatewayRef: string): Promise<void> {
    try {
      await this.gateway.closeCheckout('invoice', gatewayRef);
    } catch {
      this.alerts.raise('billing_renewal_link_open', {
        subscriptionId: due.subscriptionId,
        gatewayRef,
      });
    }
  }
}
