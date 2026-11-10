import { CATALOG_IMPORT_STATES, type CatalogImportState } from '@heliogrid/domain';
import { z } from 'zod';
import { CATALOG_IMPORT_PHASES } from './catalog-import';
import { defineWorkflow } from './registry';

/**
 * The lead import (`T-M02-005`): ONE workflow type, started once per handoff with the phase it runs
 * — `read` opens the stored file, `match` judges its rows by the confirmed mapping into a preview,
 * `run` lands them with the run's duplicate choice. The same three phases and the same job machine
 * as the catalog import, lifted rather than copied (block 3 RFC decision 16).
 *
 * The input is ids only (`infra/temporal/README.md` §4): the tenant, because a durable run has no
 * session, and the job, whose row holds everything else. The worker holds the sequence; every step
 * runs in the api, beside the CRM's tables.
 */
export const LEAD_IMPORT_PHASES = CATALOG_IMPORT_PHASES;

export const leadImportWorkflow = defineWorkflow({
  name: 'leadImport',
  taskQueue: 'heliogrid-crm',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    jobId: z.string().uuid(),
    phase: z.enum(LEAD_IMPORT_PHASES),
  }),
  // From domain's tuple, not the HTTP contract's schema: this entry never loads the HTTP surface.
  result: z.object({ status: z.enum(CATALOG_IMPORT_STATES) }),
  signals: {},
  queries: {},
  workflowId: (input) => `lead-import-${input.eventId}`,
});

/** What a step is told: whose job, by id. */
export interface LeadImportStepInput {
  readonly tenantId: string;
  readonly jobId: string;
}

/** Where a step left the job. */
export interface LeadImportStepResult {
  readonly status: CatalogImportState;
}

/**
 * The import's steps, as both processes see them: the workflow (worker) calls them by NAME and the
 * api registers them by name, so a renamed step is a compile error on both sides.
 */
export interface LeadImportActivities {
  /** Reads the job's stored file and leaves the job `mapped`, or `unreadable` with its reason. */
  readLeadImport(input: LeadImportStepInput): Promise<LeadImportStepResult>;
  /** Ends a read that failed past every retry as `unreadable` (`not_read`). */
  endLeadImportRead(input: LeadImportStepInput): Promise<LeadImportStepResult>;
  /**
   * Judges every filled row of the mapped sheet — new, duplicate by phone, or rejected with its
   * reasons — and leaves the job `previewed`; writes nothing when a newer mapping superseded it.
   */
  matchLeadImport(input: LeadImportStepInput): Promise<LeadImportStepResult>;
  /** Ends a preview pass that failed past every retry by putting the job back to `mapped`. */
  endLeadImportMatch(input: LeadImportStepInput): Promise<LeadImportStepResult>;
  /**
   * Lands the run's next batch of rows — each number checked again under its lock — with their
   * results in the same transaction. Answers `running` while rows remain, `completed` once none do.
   */
  applyLeadImportRows(input: LeadImportStepInput): Promise<LeadImportStepResult>;
  /**
   * Ends a run that failed past every retry: every row still unwritten is rejected as not written
   * and the job completes, so the report says which rows landed and which did not.
   */
  endLeadImportRun(input: LeadImportStepInput): Promise<LeadImportStepResult>;
}
