import { dueTimedCause, MS_PER_DAY, nextState, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { BillingAdminRepository, type TimedSubscription } from './billing.admin.repository';

/** At most this many rows of each kind per run, so one run stays inside its step's timeout. */
const TIMER_BATCH = 100;

/**
 * The billing timers (`M12-04`, `M12-06`, `M12-52`): every run moves each subscription the clock
 * has made due, and starts the trial of a new company an older api signed up without one. Which
 * move is due, and to where, is domain's; this only reads, asks and writes.
 */
@Injectable()
export class BillingService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(BillingAdminRepository) private readonly billing: BillingAdminRepository) {}

  async advanceDue(now: number): Promise<{ moved: number; trialsStarted: number }> {
    const due = [
      ...(await this.billing.trialsEndedBy(now, TIMER_BATCH)),
      ...(await this.billing.pastDueSince(now - PAST_DUE_GRACE_DAYS * MS_PER_DAY, TIMER_BATCH)),
    ];
    let moved = 0;
    for (const row of due) {
      if (await this.moveIfDue(row, now)) moved += 1;
    }
    let trialsStarted = 0;
    // A release rolls in minutes; a day back covers it with room to spare.
    for (const tenantId of await this.billing.companiesWithoutSubscription(
      now - MS_PER_DAY,
      now,
      TIMER_BATCH,
    )) {
      if (await this.billing.startTrialFor(tenantId, now)) trialsStarted += 1;
    }
    return { moved, trialsStarted };
  }

  private async moveIfDue(row: TimedSubscription, now: number): Promise<boolean> {
    const due = dueTimedCause(row, now);
    if (due === null) return false;
    const to = nextState(row.state, due.cause);
    if (to === null) return false;
    return this.billing.move(row, { from: row.state, to, cause: due.cause, enteredAt: due.dueAt });
  }
}
