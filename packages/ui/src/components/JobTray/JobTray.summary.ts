import type { TranslatedText } from '@heliogrid/contracts';
import type { BackgroundJob, JobTraySummary, JobTrayWords } from './JobTray.types';

/** A job with no state is running: the tray only holds work that has started. */
export function isRunning(job: BackgroundJob): boolean {
  return (job.state ?? 'running') === 'running';
}

/** The panel offers its clear once a job has finished, and only with the act and its words. */
export function offersClear(
  jobs: readonly BackgroundJob[],
  onClear: (() => void) | undefined,
  clearLabel: TranslatedText | undefined,
): boolean {
  return onClear !== undefined && clearLabel !== undefined && jobs.some((job) => !isRunning(job));
}

/**
 * AN AGGREGATE THE SHELL CAN SAY IN ONE LINE — "2 running", "1 finished", "1 failed" — because the
 * trigger is 44px of top bar, not a panel. Running speaks first (it is the thing still happening),
 * then failure, then the finished work nobody has opened yet.
 */
export function summariseJobs(jobs: BackgroundJob[], words: JobTrayWords): JobTraySummary {
  const running = jobs.filter(isRunning);
  if (running.length > 0) {
    return { words: words.running(running.length), busy: true };
  }
  const failed = jobs.filter((job) => job.state === 'failed');
  if (failed.length > 0) {
    return { words: words.failed(failed.length), busy: false, tone: 'warning' };
  }
  const done = jobs.filter((job) => job.state === 'done');
  if (done.length > 0) {
    return { words: words.finished(done.length), busy: false, tone: 'success' };
  }
  return { words: `${jobs.length}`, busy: false };
}
