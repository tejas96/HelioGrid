import { OUTBOX_WORKFLOW_NAMES, outboxWorkflowNamed } from '@heliogrid/contracts/workflows';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OutboxAdminRepository, type PendingOutboxEvent } from './outbox.admin.repository';
import { TemporalGateway } from './temporal.gateway';

/**
 * How long an event is left to the fast path before the sweep takes it. Shorter, and the sweep
 * races a dispatch still in flight (harmless — the id joins it — but every race is a wasted start);
 * longer, and a crashed dispatch waits that much more.
 */
const SWEEP_GRACE_SECONDS = 30;

/** At most this many events per sweep, so one run stays inside its step's one-minute timeout. */
const SWEEP_BATCH = 100;

/**
 * Starts the workflow each outbox event names, then marks the event. Two paths, one rule: a service
 * calls `dispatchNow` right after its commit (seconds), and the `outbox-sweep` schedule calls
 * `dispatchDue` every minute for whatever the fast path missed. Every step is retryable because
 * the workflow id is derived from the event id (`TemporalGateway.start`).
 */
@Injectable()
export class OutboxDispatcher {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalGateway) private readonly gateway: TemporalGateway,
    @Inject(OutboxAdminRepository) private readonly outbox: OutboxAdminRepository,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxDispatcher.name);
  }

  /**
   * The fast path. It never throws: the caller's change has already committed, and the sweep
   * starts the workflow a minute later if Temporal is unreachable now.
   */
  async dispatchNow(eventId: string): Promise<void> {
    try {
      const event = await this.outbox.pending(eventId);
      if (event) await this.dispatch(event);
    } catch (error) {
      this.logger.warn({ err: error, eventId }, 'an outbox event waits for the sweep');
    }
  }

  /**
   * The sweep: every event still waiting after the grace, oldest first, of a workflow this release
   * knows — an unknown one waits for the release that wrote it and never fills the batch. One event
   * that fails is logged and passed over, so it never holds back the events behind it.
   */
  async dispatchDue(): Promise<number> {
    let dispatched = 0;
    for (const event of await this.dueEvents()) {
      try {
        if (await this.dispatch(event)) dispatched += 1;
      } catch (error) {
        this.logger.error({ err: error, eventId: event.id }, 'an outbox event did not start');
      }
    }
    return dispatched;
  }

  /** What the next sweep owes a start: past the grace, of a known workflow, one batch. */
  dueEvents(): Promise<PendingOutboxEvent[]> {
    return this.outbox.due(SWEEP_GRACE_SECONDS, SWEEP_BATCH, OUTBOX_WORKFLOW_NAMES);
  }

  private async dispatch(event: PendingOutboxEvent): Promise<boolean> {
    const definition = outboxWorkflowNamed(event.workflow);
    if (definition === undefined) {
      // Written by a release that has since rolled back: kept, never dropped, until it returns.
      this.logger.error(
        { eventId: event.id, workflow: event.workflow },
        'an outbox event names a workflow this release does not know',
      );
      return false;
    }
    await this.gateway.start(definition, event.payload);
    await this.outbox.markDispatched(event.id);
    return true;
  }
}
