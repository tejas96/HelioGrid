import { platformHealthcheckWorkflow } from '@heliogrid/contracts/workflows';
import type { TemporalWorkerRegistration } from '../../common/temporal/temporal.tokens';
import { platformActivities } from './platform.activities';
import * as platformWorkflows from './platform.workflows';

/**
 * The platform module's public surface — what it hands the worker host, and nothing else.
 * A module is reached only through its `<m>.public.ts` (dep-cruiser `api-module-boundary`),
 * so its internals can change without rippling.
 */

/**
 * **The name check.** Temporal resolves a workflow by EXPORTED FUNCTION NAME, so the contract's
 * `name` and this module's export are one fact written in two places — the Law 5 defect this
 * repository exists to prevent. Nothing catches it at runtime except the workflow itself
 * failing every task with "no such function is exported by the workflow bundle", which is what
 * happened on 2026-08-26.
 *
 * `satisfies` makes it a COMPILE error instead: rename either side and this line stops
 * building. It costs one line and no runtime.
 */
platformWorkflows satisfies Record<typeof platformHealthcheckWorkflow.name, unknown>;

export const platformWorkerRegistration: TemporalWorkerRegistration = {
  taskQueue: platformHealthcheckWorkflow.taskQueue,
  // No cast: `platformActivities` is declared `: PlatformActivities`, and the workflow
  // proxies that same interface — that is where the type safety is.
  activities: platformActivities,
};
