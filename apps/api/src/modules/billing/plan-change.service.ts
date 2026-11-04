import {
  BILLING_GATEWAY,
  type BillingGateway,
  type PlanChangeOutcome,
  type PlanChangePreview,
  type PlanChangeRequest,
  type PlanPick,
} from '@heliogrid/contracts';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ContractException } from '../../common/errors/contract-exception';
import { CheckoutService } from './checkout.service';
import { EntitlementService } from './entitlement.service';
import { atGateway } from './internal/at-gateway';
import { PlanChangeAdminRepository, type PlanStanding } from './plan-change.admin.repository';
import { PlanChangePreviewService, type WorkedPick } from './plan-change.preview.service';

type Act = { readonly actorUserId: string; readonly now: number };

/**
 * The plan screen's acts on a live paid row (`SCR-M12-03`, `M12-48`, `M12-49`, `M12-12`): an
 * upgrade pays the part of its cycle left on a payment link and moves when it is paid, or at once
 * when it owes nothing; a downgrade and a cycle switch wait for the paid period's end. A trial or
 * a dead row converts through checkout, and a `past_due` row pays what it owes first.
 */
@Injectable()
export class PlanChangeService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(PlanChangeAdminRepository) private readonly changes: PlanChangeAdminRepository,
    @Inject(PlanChangePreviewService) private readonly previews: PlanChangePreviewService,
    @Inject(CheckoutService) private readonly checkouts: CheckoutService,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PlanChangeService.name);
  }

  async preview(tenantId: string, pick: PlanPick, now: number): Promise<PlanChangePreview> {
    const standing = await this.standingOf(tenantId);
    return (await this.previews.workOut(tenantId, standing, pick, now)).preview;
  }

  async change(tenantId: string, request: PlanChangeRequest, act: Act): Promise<PlanChangeOutcome> {
    const standing = await this.standingOf(tenantId);
    if (standing.state !== 'active' || standing.paidPeriodEnd === null) {
      throw notPossible(
        standing.state === 'past_due'
          ? 'Pay what this company owes first, then change the plan.'
          : 'This company has no paid plan to change. Pick a plan to pay for instead.',
      );
    }
    const pick = { tier: request.tier, cycle: request.cycle };
    const worked = await this.previews.workOut(tenantId, standing, pick, act.now);
    if (worked.preview.digest !== request.previewDigest) {
      throw new ContractException(
        'PLAN_CHANGE_PREVIEW_CHANGED',
        'What this company uses changed since the review. Read it again before you confirm.',
        HttpStatus.CONFLICT,
      );
    }
    const confirmed = {
      tenantId,
      subscriptionId: standing.subscriptionId,
      fromPlanPriceId: standing.planPriceId,
      paidPeriodEnd: standing.paidPeriodEnd,
      ...act,
      endMandate: (gatewayRef: string) =>
        atGateway(this.logger, () => this.gateway.cancelAtCycleEnd(gatewayRef)),
    };
    if (worked.kind === 'upgrade') return this.upgrade(tenantId, standing, worked, confirmed);
    if (worked.kind !== 'downgrade' && worked.kind !== 'cycle_switch') {
      throw notPossible('This company has no paid plan to change.');
    }
    await this.checkouts.closePlanChangePage(
      tenantId,
      standing.subscriptionId,
      act.now,
      notPossible,
    );
    const scheduled = await this.changes.schedule(confirmed, {
      kind: worked.kind,
      toPlanPriceId: worked.target.id,
      toCollection: worked.toCollection,
      previewDigest: worked.preview.digest,
    });
    if (scheduled === 'moved') throw movedSince();
    return { outcome: 'scheduled', effectiveAt: new Date(standing.paidPeriodEnd).toISOString() };
  }

  /** `false` when nothing was scheduled: a second press moves nothing. */
  async withdraw(tenantId: string, act: Act): Promise<{ withdrawn: boolean }> {
    const standing = await this.standingOf(tenantId);
    return {
      withdrawn: await this.changes.withdraw(tenantId, standing.subscriptionId, act),
    };
  }

  /**
   * `M12-48` — the charge for the days left is paid on a payment link, whatever the row's rail:
   * no live mandate can be moved to a new amount (`M12-57`), and a link is the rail every row
   * has. It stops taking money at the paid period's end, so no page prices days already past.
   */
  private async upgrade(
    tenantId: string,
    standing: PlanStanding,
    worked: WorkedPick,
    confirmed: Parameters<PlanChangeAdminRepository['applyNow']>[0],
  ): Promise<PlanChangeOutcome> {
    const { pack, target, charge, toCollection } = worked;
    const to = {
      tier: target.tier,
      cycle: target.cycle,
      planPriceId: target.id,
      collection: toCollection,
    };
    if (charge === null || charge === 0) {
      await this.checkouts.closePlanChangePage(
        tenantId,
        standing.subscriptionId,
        confirmed.now,
        notPossible,
      );
      const applied = await this.changes.applyNow(
        confirmed,
        to,
        this.entitlements.bookLimitsOf(pack),
      );
      if (applied === 'moved') throw movedSince();
      return { outcome: 'applied' };
    }
    const end = confirmed.paidPeriodEnd;
    const checkoutUrl = await this.checkouts.openPage(
      tenantId,
      standing.subscriptionId,
      {
        planPriceId: target.id,
        route: { collection: 'invoice' },
        gatewayPlanRef: target.gatewayPlanRef,
        amount: platformSaleTotal(pack, charge),
        currencyCode: target.currencyCode,
        expiresAt: end,
        gatewayExpiresAt: end,
        startsAt: null,
        purpose: 'plan_change',
        chargeMinor: charge,
        fromPlanPriceId: standing.planPriceId,
      },
      confirmed,
      notPossible,
    );
    return { outcome: 'page', checkoutUrl };
  }

  private async standingOf(tenantId: string): Promise<PlanStanding> {
    const standing = await this.changes.standingOf(tenantId);
    // Every company holds a subscription from signup (`M12-52`): none is no company of the caller's.
    if (standing === null) throw new NotFoundException();
    return standing;
  }
}

function notPossible(message: string): ContractException {
  return new ContractException('PLAN_CHANGE_NOT_POSSIBLE', message, HttpStatus.CONFLICT);
}

function movedSince(): ContractException {
  return notPossible('This company’s plan moved since the review. Read it again.');
}
