import { BILLING_GATEWAY, type BillingGateway, type GatewayEvent } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChargeService } from './charge.service';
import { GatewayEventAdminRepository } from './gateway-event.admin.repository';
import { BillingAlerts } from './internal/billing-alerts';

/**
 * The gateway's signed messages (`M12-09`, `M12-13`). Each is read only once its signature holds,
 * acted on until its event id is remembered, and handed to the one charge path. `invalid` is a message whose
 * signature does not hold: nothing of it is read.
 */
@Injectable()
export class GatewayEventsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BILLING_GATEWAY) private readonly gateway: BillingGateway,
    @Inject(GatewayEventAdminRepository) private readonly seen: GatewayEventAdminRepository,
    @Inject(ChargeService) private readonly charges: ChargeService,
    @Inject(BillingAlerts) private readonly alerts: BillingAlerts,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GatewayEventsService.name);
  }

  async receive(
    rawBody: Uint8Array,
    headers: Readonly<Record<string, string>>,
    now: number,
  ): Promise<'handled' | 'invalid'> {
    const event = this.gateway.readEvent(rawBody, headers);
    if (event === null) return 'invalid';
    const { provider } = this.gateway;
    if (await this.seen.handled(provider, event.eventRef)) return 'handled';
    // Remembered only after its effect: a process that dies between the two acts on the next
    // send again, and every effect is idempotent on its own key (the charge reference, the
    // failure's moment). Two sends at the same moment may both act; at worst an alert repeats.
    await this.act(event, now);
    await this.seen.remember(provider, event.eventRef, now);
    return 'handled';
  }

  private async act(event: GatewayEvent, now: number): Promise<void> {
    switch (event.kind) {
      case 'charged':
        await this.charges.recordCollected(event.charge, now);
        return;
      case 'charge_failed':
        await this.charges.recordFailedOn(event.gatewayRef, event.occurredAt);
        return;
      case 'paused':
      case 'resumed':
        // The product offers no pause (`M12-13`): logged and alerted, never applied.
        this.alerts.raise('billing_pause_event', {
          event: event.kind,
          gatewayRef: event.gatewayRef,
          eventRef: event.eventRef,
        });
        return;
      case 'other':
        this.logger.info(
          { type: event.type, eventRef: event.eventRef },
          'a gateway message billing does not act on',
        );
        return;
    }
  }
}
