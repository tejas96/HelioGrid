import type { BackgroundJob, JobTraySummary } from './JobTray.types';

/** A job with no state is running: the tray only holds work that has started. */
export function isRunning(job: BackgroundJob): boolean {
  return (job.state ?? 'running') === 'running';
}

/**
 * AN AGGREGATE THE SHELL CAN SAY IN ONE LINE — "2 running", "1 finished", "1 failed" — because the
 * trigger is 44px of top bar, not a panel. Running speaks first (it is the thing still happening),
 * then failure, then the finished work nobody has opened yet.
 */
export function summariseJobs(jobs: BackgroundJob[]): JobTraySummary {
  const running = jobs.filter(isRunning);
  if (running.length > 0) {
    return { words: running.length === 1 ? '1 running' : `${running.length} running`, busy: true };
  }
  const failed = jobs.filter((job) => job.state === 'failed');
  if (failed.length > 0) {
    return {
      words: failed.length === 1 ? '1 failed' : `${failed.length} failed`,
      busy: false,
      tone: 'warning',
    };
  }
  const done = jobs.filter((job) => job.state === 'done');
  if (done.length > 0) {
    return {
      words: done.length === 1 ? '1 finished' : `${done.length} finished`,
      busy: false,
      tone: 'success',
    };
  }
  return { words: `${jobs.length}`, busy: false };
}
