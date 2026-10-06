import type { WorkflowDefinition } from '@heliogrid/contracts/workflows';
import { Inject, Injectable } from '@nestjs/common';
import {
  type IntervalSpec,
  ScheduleAlreadyRunning,
  ScheduleOverlapPolicy,
  WorkflowExecutionAlreadyStartedError,
  type WorkflowHandle,
} from '@temporalio/client';
import type { z } from 'zod';
import type { TemporalConnection } from './temporal.client';
import { TEMPORAL_CLIENT } from './temporal.tokens';

/**
 * The ONE seam through which this app starts, signals, queries and schedules workflows.
 *
 * A feature service asks for a workflow BY ITS CONTRACT — never by a string type name, never
 * by hand-building a workflow id. That is what makes the id derivation (the dedupe key) and
 * the payload shape impossible to get individually wrong at fifty future call sites.
 *
 * **Every payload is validated at ingress.** TypeScript does not survive a process boundary:
 * the worker deserialises whatever bytes arrive, and `as` on the sending side is a promise
 * about a value nobody checked. A malformed payload must be refused HERE, where the caller
 * still has a stack, rather than becoming a workflow that fails on its first task.
 */
@Injectable()
export class TemporalGateway {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TEMPORAL_CLIENT) private readonly connection: TemporalConnection) {}

  /**
   * Starts a workflow, or attaches to the one already started under the same id.
   *
   * Called from a retryable dispatcher, so a second attempt for the SAME durable event must never
   * be a second run. `USE_EXISTING` joins a run still in flight (proven in
   * `infra/temporal/spike/probe-durable-handoff.mjs`); it says nothing about a run that has already
   * FINISHED, which Temporal would start afresh — so `REJECT_DUPLICATE` refuses that, and the
   * refusal is read as "already started", the answer a retry wants.
   */
  async start<D extends WorkflowDefinition>(
    definition: D,
    input: z.infer<D['input']>,
  ): Promise<WorkflowHandle> {
    const parsed = definition.input.parse(input);
    const workflowId = definition.workflowId(parsed);
    const client = await this.connection.client();
    try {
      return await client.workflow.start(definition.name, {
        taskQueue: definition.taskQueue,
        workflowId,
        args: [parsed],
        workflowIdConflictPolicy: 'USE_EXISTING',
        workflowIdReusePolicy: 'REJECT_DUPLICATE',
      });
    } catch (error) {
      if (!(error instanceof WorkflowExecutionAlreadyStartedError)) throw error;
      return client.workflow.getHandle(workflowId);
    }
  }

  /**
   * Holds the schedule that starts `definition` every `every` to that declaration: created when
   * absent, brought up to date when present — one schedule for the whole cluster, however many api
   * processes boot, and a changed interval or policy reaches it on the next boot. `SKIP` means a
   * run still going when the next is due is never joined by a second, and a catch-up window of one
   * interval means runs missed while the cluster was down are made up once, not once per missed
   * interval (Temporal's default window is a year).
   */
  async ensureSchedule<D extends WorkflowDefinition>(
    scheduleId: string,
    definition: D,
    input: z.infer<D['input']>,
    every: IntervalSpec['every'],
  ): Promise<void> {
    const parsed = definition.input.parse(input);
    const declared = {
      spec: { intervals: [{ every }] },
      action: {
        type: 'startWorkflow' as const,
        workflowType: definition.name,
        taskQueue: definition.taskQueue,
        workflowId: definition.workflowId(parsed),
        args: [parsed],
      },
      policies: { overlap: ScheduleOverlapPolicy.SKIP, catchupWindow: every },
    };
    const client = await this.connection.client();
    try {
      await client.schedule.create({ scheduleId, ...declared });
    } catch (error) {
      if (!(error instanceof ScheduleAlreadyRunning)) throw error;
      await client.schedule
        .getHandle(scheduleId)
        .update((current) => ({ ...current, ...declared }));
    }
  }

  /** Signals a running workflow. The payload is validated against the contract's signal schema. */
  async signal<D extends WorkflowDefinition, K extends keyof D['signals'] & string>(
    definition: D,
    workflowId: string,
    signal: K,
    payload: z.infer<D['signals'][K]>,
  ): Promise<void> {
    const schema = definition.signals[signal];
    if (!schema) throw new Error(`${definition.name} declares no signal '${signal}'`);
    const client = await this.connection.client();
    await client.workflow.getHandle(workflowId).signal(signal, schema.parse(payload));
  }

  /**
   * Queries a running workflow. The RESULT is validated too — a query answer is a value this
   * process is about to act on, and the worker that produced it may be running older code.
   */
  async query<D extends WorkflowDefinition, K extends keyof D['queries'] & string>(
    definition: D,
    workflowId: string,
    query: K,
  ): Promise<z.infer<D['queries'][K]>> {
    const schema = definition.queries[query];
    if (!schema) throw new Error(`${definition.name} declares no query '${query}'`);
    const client = await this.connection.client();
    return schema.parse(await client.workflow.getHandle(workflowId).query(query));
  }

  /** Awaits completion. Validated for the same reason a query result is. */
  async result<D extends WorkflowDefinition>(
    definition: D,
    workflowId: string,
  ): Promise<z.infer<D['result']>> {
    const client = await this.connection.client();
    return definition.result.parse(await client.workflow.getHandle(workflowId).result());
  }
}
