import { centreHorizonStart } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { NotificationHorizonAdminRepository } from './notification.horizon.admin.repository';

/** One delete's size: short enough that each holds its locks only briefly. */
const PURGE_BATCH = 1_000;

/** At most this many deletes per run, so one run stays inside its step's timeout. */
const PURGE_BATCHES_PER_RUN = 100;

/**
 * The horizon purge (`F6-19`): every notice older than the centre reads is deleted, a batch at
 * a time, from the same horizon every centre read is bounded by. A backlog larger than one run
 * finishes on the next.
 */
@Injectable()
export class NotificationHorizonService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(NotificationHorizonAdminRepository)
    private readonly rows: NotificationHorizonAdminRepository,
  ) {}

  /** The result is the workflow's contract: a running worker reads exactly this count. */
  async purgePastHorizon(now: number): Promise<{ purged: number }> {
    const horizon = new Date(centreHorizonStart(now));
    let purged = 0;
    for (let batch = 0; batch < PURGE_BATCHES_PER_RUN; batch += 1) {
      const gone = await this.rows.purgeBefore(horizon, PURGE_BATCH);
      purged += gone;
      if (gone < PURGE_BATCH) break;
    }
    return { purged };
  }
}
