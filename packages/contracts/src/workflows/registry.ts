import type { z } from 'zod';

/**
 * The vocabulary a Temporal workflow is addressed by, and the reason it lives in contracts
 * rather than in the worker: the API STARTS workflows and the worker EXECUTES them, so the
 * names, the payload shapes and the id rule are a wire contract between two processes exactly
 * like an HTTP route is. Putting them in the worker would make the API import the worker.
 *
 * **Every name here is permanent once a durable history exists.** A workflow type name is
 * written into history; a task queue is what a running worker polls; a workflow id is the
 * dedupe key the outbox retries against. Renaming any of them after the first execution is a
 * migration, not a rename (ADR-0025, `infra/temporal/README.md` §4).
 */

/**
 * Task queues are a scaling and isolation boundary, not a label: a slow PDF render on the
 * same queue as lead assignment starves it. One per business area as modules land.
 */
export const TASK_QUEUES = ['heliogrid-platform'] as const;
export type TaskQueue = (typeof TASK_QUEUES)[number];

export interface WorkflowDefinition<
  TName extends string = string,
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TResult extends z.ZodTypeAny = z.ZodTypeAny,
  TSignals extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
  TQueries extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
> {
  /**
   * The registered workflow TYPE. Written into history — permanent.
   *
   * It must be a valid JS identifier and must equal the name the worker EXPORTS: Temporal
   * resolves a workflow by exported function name, and a mismatch is not a type error, it is
   * a workflow that starts, sits in the queue and fails every task with "no such function is
   * exported by the workflow bundle". Hit on 2026-08-26 with a dotted name. The literal type
   * is preserved so each module can assert the two agree at compile time — see
   * `apps/worker/src/modules/platform/platform.public.ts`.
   */
  readonly name: TName;
  readonly taskQueue: TaskQueue;
  /** Validated at ingress on BOTH sides. TypeScript does not survive a process boundary. */
  readonly input: TInput;
  readonly result: TResult;
  readonly signals: TSignals;
  readonly queries: TQueries;
  /**
   * DERIVED from the input, never generated. The id IS the deduplication key: a random one
   * makes every dispatcher retry a second workflow, which is the doubling the outbox exists
   * to prevent.
   */
  workflowId(input: z.infer<TInput>): string;
}

/** Narrows a definition to its own literal types while keeping the shape checked. */
export function defineWorkflow<
  TName extends string,
  TInput extends z.ZodTypeAny,
  TResult extends z.ZodTypeAny,
  TSignals extends Record<string, z.ZodTypeAny>,
  TQueries extends Record<string, z.ZodTypeAny>,
>(
  definition: WorkflowDefinition<TName, TInput, TResult, TSignals, TQueries>,
): WorkflowDefinition<TName, TInput, TResult, TSignals, TQueries> {
  return definition;
}

export type WorkflowInput<T> =
  T extends WorkflowDefinition<infer _N, infer I, infer _R, infer _S, infer _Q>
    ? z.infer<I>
    : never;

export type WorkflowResult<T> =
  T extends WorkflowDefinition<infer _N, infer _I, infer R, infer _S, infer _Q>
    ? z.infer<R>
    : never;
