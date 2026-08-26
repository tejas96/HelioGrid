import { Inject, Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { Worker } from '@temporalio/worker';
import { ENV } from '../../config/env';
import { connectToTemporal, type WorkerConnection } from './temporal.connection';
import { TEMPORAL_WORKER_REGISTRATIONS, type TemporalWorkerRegistration } from './temporal.tokens';
import { assertWorkflowBundle } from './workflow-bundle';

/**
 * The worker's lifecycle, owned by Nest so shutdown is not a `process.on` afterthought.
 *
 * GRACEFUL SHUTDOWN is the reason this is a provider rather than a script. On SIGTERM — which
 * is what a deploy sends — `shutdown()` stops polling for NEW tasks and lets the in-flight
 * ones finish. Killing the process instead does not lose the workflows (they are durable) but
 * it does abandon activities mid-effect, and an activity is exactly the place where a side
 * effect is half-applied. `fly.toml`'s `kill_timeout` must exceed the longest activity, or
 * the platform kills what this is trying to drain.
 *
 * ONE Worker per task queue, because a task queue is a scaling and isolation boundary: a slow
 * PDF render sharing a queue with lead assignment starves it. The registrations arrive from
 * the business modules — `common/` never imports one (`common-imports-no-modules`).
 */
@Injectable()
export class TemporalWorkerHost implements OnModuleInit, OnApplicationShutdown {
  private connection?: WorkerConnection;
  private workers: Worker[] = [];
  private running: Promise<void>[] = [];

  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/worker/CLAUDE.md landmine).
  constructor(
    @Inject(TEMPORAL_WORKER_REGISTRATIONS)
    private readonly registrations: readonly TemporalWorkerRegistration[],
  ) {}

  async onModuleInit(): Promise<void> {
    this.connection = await connectToTemporal();
    // The pre-built artifact, never `workflowsPath` — see workflow-bundle.ts for why booting
    // without it must fail rather than silently bundle at runtime.
    const codePath = assertWorkflowBundle();

    for (const registration of this.registrations) {
      const worker = await Worker.create({
        connection: this.connection.connection,
        namespace: ENV.TEMPORAL_NAMESPACE,
        taskQueue: registration.taskQueue,
        workflowBundle: { codePath },
        activities: registration.activities,
        // Identifies the BUILD holding this queue. "Which build is stuck on this queue" is the
        // first question during a bad deploy, and a default identity cannot answer it.
        identity: `heliogrid-worker@${ENV.NODE_ENV}`,
      });
      this.workers.push(worker);
      // Deliberately NOT awaited: `run()` resolves only at shutdown, so awaiting it here would
      // block Nest's init and the process would never finish booting.
      this.running.push(worker.run());
    }
  }

  /**
   * Shutdown must never THROW. A hook that throws leaves Nest's shutdown sequence unfinished,
   * the process hanging and the platform eventually killing it — abandoning exactly the
   * in-flight activities this drain exists to protect.
   *
   * `Worker.shutdown()` raises `IllegalStateError: Not running. Current state: DRAINING` if it
   * is called when a drain is already under way, which happens on a second SIGTERM or when a
   * supervisor signals the group. Observed 2026-08-26. Only RUNNING workers are asked to stop,
   * and the call is guarded anyway — a state machine read and then acted on is a race.
   */
  async onApplicationShutdown(): Promise<void> {
    for (const worker of this.workers) {
      try {
        if (worker.getState() === 'RUNNING') worker.shutdown();
      } catch {
        // Already stopping. Nothing to do, and nothing worth failing a shutdown over.
      }
    }
    this.connection?.stopTokenRefresh();
    await Promise.allSettled(this.running);
    await this.connection?.connection.close().catch(() => undefined);
  }
}
