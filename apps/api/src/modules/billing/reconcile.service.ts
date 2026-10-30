import { BILLING_GATEWAY, type BillingGateway } from '@heliogrid/contracts';
import type { ReconcilePageResult } from '@heliogrid/contracts/workflows';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChargeService } from './charge.service';
import { BillingAlerts } from './internal/billing-alerts';
import { carriedOf, cursorOf, ReconcileAdminRepository } from './reconcile.admin.repository';

/** Refs per page: at one gateway call each, ten seconds at worst, a page fits its step's five minutes. */
const PAGE_SIZE = 20;

/**
 * The 6-hour reconcile (`M12-09`, `M12-43`): asks the gateway what it collected on each ref a
 * charge can still land on, and hands every charge to the one charge path. A charge the path had
 * already recorded is the boring case; one it had not is drift, repaired, and alerted. A ref the
 * gateway does not answer for is skipped and tried at the next run.
 */
@Injectable()
export class ReconcileService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ReconcileAdminRepository) private readonly refs: ReconcileAdminRepository,
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(ChargeService) private readonly charges: ChargeService,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReconcileService.name);
  }

  /** `after` is the cursor the last page answered, as the workflow carries it; `null` to start. */
  async reconcilePage(after: string | null, now: number): Promise<ReconcilePageResult> {
    const { refs, next } = await this.refs.page(cursorOf(after), PAGE_SIZE, now);
    let repaired = 0;
    for (const { gatewayRef, collection } of refs) {
      let collected: Awaited<ReturnType<BillingGateway['chargesOn']>>;
      try {
        collected = await this.gateway.chargesOn(collection, gatewayRef);
      } catch (error) {
        this.logger.warn(
          { err: error, gatewayRef },
          'the gateway did not answer for a ref; next run',
        );
        continue;
      }
      for (const charge of collected) {
        if ((await this.charges.recordCollected(charge, now)) !== 'recorded') continue;
        repaired += 1;
        this.alerts.raise('billing_repair', { gatewayRef, chargeRef: charge.chargeRef });
      }
    }
    return { checked: refs.length, repaired, after: next === null ? null : carriedOf(next) };
  }
}
