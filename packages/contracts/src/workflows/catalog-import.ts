import { CATALOG_IMPORT_STATES, type CatalogImportState } from '@heliogrid/domain';
import { z } from 'zod';
import { defineWorkflow } from './registry';

/**
 * The catalog import (`T-M01-030`): ONE workflow type, started once per handoff with the phase it
 * runs: `read` opens the stored file, `match` matches its rows by the confirmed mapping, `run`
 * writes them into the catalog. A phase is an added value, which every payload already stored
 * still parses (`outbox.ts` says why that matters).
 *
 * The input is ids only (`infra/temporal/README.md` §4): the tenant, because a durable run has no
 * session, and the job, whose row holds everything else. The worker holds the sequence; every step
 * runs in the api, beside the catalog's tables.
 */
export const CATALOG_IMPORT_PHASES = ['read', 'match', 'run'] as const;

export const catalogImportWorkflow = defineWorkflow({
  name: 'catalogImport',
  taskQueue: 'heliogrid-catalog',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    jobId: z.string().uuid(),
    phase: z.enum(CATALOG_IMPORT_PHASES),
  }),
  // From domain's tuple, not the HTTP contract's schema: this entry never loads the HTTP surface.
  result: z.object({ status: z.enum(CATALOG_IMPORT_STATES) }),
  signals: {},
  queries: {},
  workflowId: (input) => `catalog-import-${input.eventId}`,
});

/** What a step is told: whose job, by id. */
export interface CatalogImportStepInput {
  readonly tenantId: string;
  readonly jobId: string;
}

/** Where a step left the job. */
export interface CatalogImportStepResult {
  readonly status: CatalogImportState;
}

/**
 * The import's steps, as both processes see them: the workflow (worker) calls them by NAME and the
 * api registers them by name, so a renamed step is a compile error on both sides.
 */
export interface CatalogImportActivities {
  /** Reads the job's stored file and leaves the job `mapped`, or `unreadable` with its reason. */
  readCatalogImport(input: CatalogImportStepInput): Promise<CatalogImportStepResult>;
  /**
   * Ends a read that failed past every retry — the store or the database stayed down — as
   * `unreadable` (`not_read`), so no job waits in `reading` for good.
   */
  endCatalogImportRead(input: CatalogImportStepInput): Promise<CatalogImportStepResult>;
  /**
   * Matches every filled row of the mapped sheet and leaves the job `previewed` with its rows — or,
   * when a newer mapping has superseded the one it read, writes nothing.
   */
  matchCatalogImport(input: CatalogImportStepInput): Promise<CatalogImportStepResult>;
  /**
   * Ends a pass that failed past every retry by putting the job back to `mapped`, unless a newer
   * mapping has taken over, so the wizard offers the confirm again.
   */
  endCatalogImportMatch(input: CatalogImportStepInput): Promise<CatalogImportStepResult>;
  /**
   * Writes the run's next batch of rows into the catalog, each judged again against the catalog as
   * it stands, with their results in the same transaction. Answers `running` while rows remain to
   * write, and `completed` once none do — the workflow calls it again until then.
   */
  applyCatalogImportRows(input: CatalogImportStepInput): Promise<CatalogImportStepResult>;
  /**
   * Ends a run that failed past every retry: every row still unwritten is failed as `not_applied`
   * and the job completes, so the report says which rows landed and which did not.
   */
  endCatalogImportRun(input: CatalogImportStepInput): Promise<CatalogImportStepResult>;
}
