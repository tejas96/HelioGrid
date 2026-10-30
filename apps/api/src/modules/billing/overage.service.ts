import { BILLING_GATEWAY, type BillingGateway } from '@heliogrid/contracts';
import {
  ADD_ON_LEAD_DAYS,
  BILLED_LEDGER_METERS,
  type BilledLedgerMeter,
  collectionRoute,
  type MarketPack,
  MS_PER_DAY,
  mandateType,
  type TierLimit,
  tierBand,
  UnbillableMeter,
} from '@heliogrid/domain';
import { addOnVerdict, overageAddOns, platformSaleTotal } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MarketPackService } from '../market/market.public';
import { EntitlementService } from './entitlement.service';
import { BillingAlerts } from './internal/billing-alerts';
import {
  type AddOnWaiting,
  OverageAdminRepository,
  type PeriodDue,
} from './overage.admin.repository';
import { UsageService } from './usage.service';

/** Periods reckoned per run: each is two reads and one write, no gateway call. */
const BATCH = 100;

/**
 * Add-ons tried per run. Each may wait up to the gateway's 10 s call timeout, so a full batch ends
 * well inside the step's 10-minute timeout and a retry never runs beside a run still adding.
 */
const ADD_BATCH = 25;

/**
 * The overage sweep (`M12-35`): each closed, settled mandate period's use past the company's
 * allowance, reckoned once at the book's published rates, then added to the mandate's next debit
 * so the gateway collects it. Which meters bill and how is domain's (`commerce/overage.ts`).
 */
@Injectable()
export class OverageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(OverageAdminRepository) private readonly overage: OverageAdminRepository,
    @Inject(UsageService) private readonly usage: UsageService,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OverageService.name);
  }

  /** The sweep's one step: reckon what closed, then add what waits. */
  async addDue(now: number): Promise<{ reckoned: number; added: number }> {
    const packs = new Map<string, MarketPack>();
    const packOf = async (marketCode: string) => {
      const known = packs.get(marketCode) ?? (await this.markets.currentPackOf(marketCode));
      packs.set(marketCode, known);
      return known;
    };
    let reckoned = 0;
    for (const period of await this.overage.periodsDue(now, BATCH)) {
      reckoned += await this.reckon(period, await packOf(period.marketCode), now);
    }
    let added = 0;
    const leadMs = ADD_ON_LEAD_DAYS * MS_PER_DAY;
    for (const addOn of await this.overage.waiting(now, leadMs, ADD_BATCH)) {
      if (await this.add(addOn, await packOf(addOn.marketCode), now)) added += 1;
    }
    return { reckoned, added };
  }

  /**
   * One period's add-ons, against the company's allowance as it stands now (support credit
   * included). A pack the book cannot bill by is logged and passed over, so it never holds back
   * the rest of the batch; the period stays unreckoned until it falls out of reach.
   */
  private async reckon(period: PeriodDue, pack: MarketPack, now: number): Promise<number> {
    const limits = await this.entitlements.limitsOf(period.tenantId);
    const allowances = new Map<BilledLedgerMeter, TierLimit>();
    for (const meter of BILLED_LEDGER_METERS) {
      const limit = limits?.get(meter)?.limit;
      if (limit !== undefined) allowances.set(meter, limit);
    }
    const used = await this.usage.billedRollupOf(period.tenantId, BILLED_LEDGER_METERS, period);
    try {
      return await this.overage.reckon(
        period,
        overageAddOns(pack.priceBook, allowances, used),
        now,
      );
    } catch (unbillable) {
      if (!(unbillable instanceof UnbillableMeter)) throw unbillable;
      this.logger.error(
        { paymentId: period.paymentId, reason: unbillable.message },
        'a period whose overage the book cannot bill',
      );
      return 0;
    }
  }

  /**
   * One add-on onto its mandate's next debit, when the plan, what already waits there and this
   * one fit under the mandate's per-debit cap. One that fits no debit at all is marked and alerted
   * once; one that fits a later debit waits. The row is claimed before the call, so an unanswered
   * call leaves it `adding` and alerted — never sent blind again.
   */
  private async add(addOn: AddOnWaiting, pack: MarketPack, now: number): Promise<boolean> {
    const route = collectionRoute(pack.paymentRails, tierBand(addOn.tier), addOn.cycle);
    if (route.collection !== 'mandate') return false;
    const mandate = mandateType(pack.paymentRails, route.primary);
    if (mandate === null) throw new Error(`no mandate type ${route.primary} in ${pack.market}`);
    const gatewayAmount = platformSaleTotal(pack, addOn.amount);
    const verdict = await this.overage.claim(addOn, gatewayAmount, now, (waiting) =>
      addOnVerdict(mandate, addOn.planAmount, waiting, gatewayAmount),
    );
    const facts = {
      subscriptionId: addOn.subscriptionId,
      addOnId: addOn.id,
      amount: gatewayAmount,
    };
    if (verdict === 'over_cap') this.alerts.raise('billing_overage_over_cap', facts);
    if (verdict !== 'add') return false;
    try {
      const answer = await this.gateway.addToNextCharge({
        gatewayRef: addOn.gatewayRef,
        meter: addOn.meter,
        amount: gatewayAmount,
        currencyCode: addOn.currencyCode,
        addOnId: addOn.id,
      });
      await this.overage.settle(addOn.id, answer, now);
      // A first refusal may be passing; one that repeats is the team's to look at.
      if (answer.kind === 'refused' && addOn.triedAt !== null) {
        this.alerts.raise('billing_overage_refused', facts);
      } else if (answer.kind === 'refused') {
        this.logger.warn(facts, 'the gateway refused an overage add-on; it waits for the next run');
      }
      return answer.kind === 'added';
    } catch (unanswered) {
      this.alerts.raise('billing_overage_unsure', {
        ...facts,
        reason: unanswered instanceof Error ? unanswered.message : 'unknown',
      });
      return false;
    }
  }
}
