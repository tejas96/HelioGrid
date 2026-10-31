import { dueTimedCause, MS_PER_DAY, nextState, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { BillingAdminRepository, type TimedSubscription } from './billing.admin.repository';
import { EntitlementService } from './entitlement.service';
import { RenewalService } from './renewal.service';

/** At most this many rows of each kind per run, so one run stays inside its step's timeout. */
const TIMER_BATCH = 100;

/**
 * The billing timers (`M12-04`, `M12-06`, `M12-52`): every run moves each subscription the clock
 * has made due — a renewal link unpaid at its due moment included (`M12-05`) — starts the trial of a new company an older api signed up without one, and writes
 * the limits of a live company that lacks them (`M12-16`). Which move is due, and to where, is
 * domain's; this only reads, asks and writes.
 */
@Injectable()
export class BillingService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(BillingAdminRepository) private readonly billing: BillingAdminRepository,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
    @Inject(RenewalService) private readonly renewals: RenewalService,
  ) {}

  /** The result is the workflow's contract: a running worker reads exactly these two counts. */
  async advanceDue(now: number): Promise<{ moved: number; trialsStarted: number }> {
    const due = [
      ...(await this.billing.trialsEndedBy(now, TIMER_BATCH)),
      ...(await this.billing.pastDueSince(now - PAST_DUE_GRACE_DAYS * MS_PER_DAY, TIMER_BATCH)),
    ];
    let moved = 0;
    for (const row of due) {
      if (await this.moveIfDue(row, now)) moved += 1;
    }
    // A renewal link unpaid at its due moment is a failed charge (`M12-05`).
    moved += await this.renewals.failUnpaid(now);
    let trialsStarted = 0;
    // A release rolls in minutes; a day back covers it with room to spare.
    for (const { tenantId, marketCode } of await this.billing.companiesWithoutSubscription(
      now - MS_PER_DAY,
      now,
      TIMER_BATCH,
    )) {
      const trialLimits = (await this.entitlements.limitsIn(marketCode))(null);
      if (await this.billing.startTrialFor(tenantId, now, trialLimits)) trialsStarted += 1;
    }
    await this.entitlements.repair(now);
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
