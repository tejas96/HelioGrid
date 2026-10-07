import type { TaskQueue, WorkflowDefinition } from '@heliogrid/contracts/workflows';
import {
  createIdentityTokenReader,
  temporalTlsFrom,
  watchIdentityToken,
} from '@heliogrid/env/server';
import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { ApplicationFailure, type IntervalSpec } from '@temporalio/client';
import { NativeConnection, Worker } from '@temporalio/worker';
import { PinoLogger } from 'nestjs-pino';
import { ENV } from '../../config/env';
import { TemporalGateway } from './temporal.gateway';

/** A schedule a queue's steps are run by — one per cluster, created when absent. */
export interface ActivitySchedule {
  readonly id: string;
  readonly workflow: WorkflowDefinition;
  readonly input: unknown;
  readonly every: IntervalSpec['every'];
}

/** One queue's steps, typed by their owner against the contract's activity interface. */
export interface ActivityRegistration {
  readonly taskQueue: TaskQueue;
  readonly activities: object;
  readonly schedule?: ActivitySchedule;
}

/**
 * A step that can never succeed — the record it works on is gone — fails for good, so its workflow
 * ends; any other error a step throws is retried by Temporal.
 */
export function stepCannotSucceed(message: string): Error {
  return ApplicationFailure.nonRetryable(message);
}

/** How long an unreachable Temporal is left before the host connects again. */
const RECONNECT_AFTER_MS = 15_000;

/**
 * Runs workflow STEPS (activities) inside the api, beside the tables and repositories they write
 * (owner ruling, `T-M01-030`): the worker holds each workflow's sequence, this holds its steps, so
 * no step needs a second copy of a module's repositories, audit entries or rules.
 *
 * One activities-only Temporal worker per registered queue — no workflow bundle, so it never polls
 * a workflow task. A module registers its queue at init; `main.ts` calls `start()` once the server
 * listens. A test or a `src/scripts/` command never calls it, so it never polls: a process on
 * `heliogrid_test` taking the dev api's steps would run them against the wrong database.
 *
 * Started in the background and reconnected while Temporal is unreachable, so an outage never
 * stops the api booting or serving reads (`T-FPLAT-064`). The reconnect is per process by design;
 * a periodic JOB is a Temporal Schedule, created here once per cluster.
 */
@Injectable()
export class TemporalActivityHost implements OnApplicationShutdown {
  private readonly registrations: ActivityRegistration[] = [];
  private connection?: NativeConnection;
  private stopTokenRefresh?: () => void;
  private workers: Worker[] = [];
  private running: Promise<unknown>[] = [];
  private reconnect?: NodeJS.Timeout;
  private stopping = false;

  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalGateway) private readonly gateway: TemporalGateway,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TemporalActivityHost.name);
  }

  register(registration: ActivityRegistration): void {
    this.registrations.push(registration);
  }

  start(): void {
    void this.open();
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    clearTimeout(this.reconnect);
    await this.close();
  }

  private async open(): Promise<void> {
    if (this.stopping) return;
    try {
      await this.hostEveryQueue();
      this.logger.info(
        { queues: this.registrations.map((registration) => registration.taskQueue) },
        'hosting workflow steps',
      );
    } catch (error) {
      this.logger.warn({ err: error }, 'Temporal is unreachable; hosting the steps again shortly');
      await this.close();
      this.openLater();
    }
  }

  private async hostEveryQueue(): Promise<void> {
    const readToken = createIdentityTokenReader(ENV.TEMPORAL_AUTH_TOKEN_FILE);
    const connection = await NativeConnection.connect({
      address: ENV.TEMPORAL_ADDRESS,
      tls: temporalTlsFrom(ENV),
      apiKey: readToken(),
    });
    this.connection = connection;
    this.stopTokenRefresh = watchIdentityToken(readToken, (token) => connection.setApiKey(token));

    for (const { taskQueue, activities } of this.registrations) {
      const worker = await Worker.create({
        connection,
        namespace: ENV.TEMPORAL_NAMESPACE,
        taskQueue,
        activities,
        identity: `heliogrid-api@${ENV.NODE_ENV}`,
      });
      this.workers.push(worker);
      // Not awaited: `run()` resolves only at shutdown. It REJECTS when the worker fails for good,
      // and then every queue is hosted afresh.
      const run = worker.run();
      this.running.push(run.catch(() => undefined));
      run.catch((error: unknown) => this.workerFailed(error));
    }
    await this.holdSchedules();
  }

  /**
   * Apart from the step workers on purpose: two api processes booting together can race on one
   * schedule's update, and that must never stop steps already being served. A failed schedule is
   * logged and tried again on the reconnect cadence.
   */
  private async holdSchedules(): Promise<void> {
    try {
      for (const { schedule } of this.registrations) {
        if (schedule === undefined) continue;
        await this.gateway.ensureSchedule(
          schedule.id,
          schedule.workflow,
          schedule.input,
          schedule.every,
        );
      }
    } catch (error) {
      if (this.stopping) return;
      this.logger.warn({ err: error }, 'a schedule was not set; setting it again shortly');
      setTimeout(() => void this.holdSchedules(), RECONNECT_AFTER_MS).unref();
    }
  }

  private workerFailed(error: unknown): void {
    if (this.stopping) return;
    this.logger.error({ err: error }, 'a step worker stopped; hosting the steps again shortly');
    this.openLater();
  }

  private openLater(): void {
    if (this.stopping || this.reconnect !== undefined) return;
    this.reconnect = setTimeout(() => {
      this.reconnect = undefined;
      void this.close().then(() => this.open());
    }, RECONNECT_AFTER_MS);
    this.reconnect.unref();
  }

  /** Never throws: a shutdown hook that throws leaves the process hanging (`temporal.worker.ts`). */
  private async close(): Promise<void> {
    for (const worker of this.workers) {
      try {
        if (worker.getState() === 'RUNNING') worker.shutdown();
      } catch {
        // Already stopping.
      }
    }
    this.stopTokenRefresh?.();
    await Promise.allSettled(this.running);
    await this.connection?.close().catch(() => undefined);
    this.workers = [];
    this.running = [];
    this.connection = undefined;
    this.stopTokenRefresh = undefined;
  }
}
