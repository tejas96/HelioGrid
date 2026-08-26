/**
 * `@heliogrid/contracts/workflows` — the Temporal message surface.
 *
 * A SEPARATE entry point from `.`: this is a process-to-process contract between the API and
 * the worker, not part of the HTTP API, and it must never reach the OpenAPI artifact or a
 * frontend bundle. `package-index-only` names it explicitly; nothing else in the tree may be
 * imported.
 *
 * `./jobs` is GONE (Track 9, ADR-0025) — BullMQ is removed and nothing replaces this file's
 * former sibling. Do not add one back.
 */

export { platformHealthcheckWorkflow } from './platform';
export type {
  TaskQueue,
  WorkflowDefinition,
  WorkflowInput,
  WorkflowResult,
} from './registry';
export { defineWorkflow, TASK_QUEUES } from './registry';
