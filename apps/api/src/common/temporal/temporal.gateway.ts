import type { WorkflowDefinition } from '@heliogrid/contracts/workflows';
import { Inject, Injectable } from '@nestjs/common';
import type { Client, WorkflowHandle } from '@temporalio/client';
import type { z } from 'zod';
import { TEMPORAL_CLIENT } from './temporal.tokens';

/**
 * The ONE seam through which this app starts, signals and queries workflows.
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
  constructor(@Inject(TEMPORAL_CLIENT) private readonly client: Client) {}

  /**
   * Starts a workflow, or attaches to the one already running under the same id.
   *
   * `USE_EXISTING` is the whole point: this is called from a retryable dispatcher, so a second
   * attempt for the SAME durable event must join the run in flight rather than fail or start
   * a second one. Proven in `infra/temporal/spike/probe-durable-handoff.mjs`.
   */
  async start<D extends WorkflowDefinition>(
    definition: D,
    input: z.infer<D['input']>,
  ): Promise<WorkflowHandle> {
    const parsed = definition.input.parse(input);
    return this.client.workflow.start(definition.name, {
      taskQueue: definition.taskQueue,
      workflowId: definition.workflowId(parsed),
      args: [parsed],
      workflowIdConflictPolicy: 'USE_EXISTING',
    });
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
    await this.client.workflow.getHandle(workflowId).signal(signal, schema.parse(payload));
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
    return schema.parse(await this.client.workflow.getHandle(workflowId).query(query));
  }

  /** Awaits completion. Validated for the same reason a query result is. */
  async result<D extends WorkflowDefinition>(
    definition: D,
    workflowId: string,
  ): Promise<z.infer<D['result']>> {
    return definition.result.parse(await this.client.workflow.getHandle(workflowId).result());
  }
}
