import type { TaskQueue } from '@heliogrid/contracts/workflows';

/**
 * What a business module hands the worker host so that `common/` never imports a module.
 *
 * `common/` is framework plumbing BENEATH the modules and may not depend on one
 * (dep-cruiser `common-imports-no-modules`) — the host would otherwise have to know that
 * `modules/platform` exists, and every new business area would edit framework code. It
 * depends on this INTERFACE instead; each module provides an implementation, exactly as a
 * guard depends on a port rather than on the module that satisfies it.
 */
export interface TemporalWorkerRegistration {
  readonly taskQueue: TaskQueue;
  /**
   * The activity implementations for this queue — absent when the queue's steps run in the api
   * beside their data (the outbox sweep, the catalog import): this process then holds the workflow
   * alone and polls no activity task.
   *
   * `object` is what the SDK itself accepts, and narrowing it here would be a lie dressed as
   * safety: the real check is that each module's activities object is declared
   * `: <Module>Activities`, and that the workflow proxies THAT SAME interface. Forcing a
   * narrower shape here only produced an unsound `as` at the one call site.
   */
  readonly activities?: object;
  /**
   * How many of this queue's steps one process runs at once; absent, the SDK's default. Set it
   * where a step is heavy — a render holds a Chromium page of hundreds of MB — so a burst queues
   * at Temporal instead of running the process out of memory.
   */
  readonly maxConcurrentActivities?: number;
}

export const TEMPORAL_WORKER_REGISTRATIONS = Symbol.for('heliogrid.TemporalWorkerRegistrations');
