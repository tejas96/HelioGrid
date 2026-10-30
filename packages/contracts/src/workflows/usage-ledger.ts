import { LEDGER_METERS, SUBJECT_KINDS } from '@heliogrid/domain';
import { z } from 'zod';
import { defineWorkflow, type WorkflowResult } from './registry';

/**
 * One usage event, carried from the outbox to the ledger (`M12-18`, `M12-32`). A producer writes
 * the outbox row in its own transaction, so the act and its handoff commit together; the ledger
 * row is written by this workflow's step afterwards, so a failing meter write never fails or
 * delays the act it records — Temporal retries the step and the outbox sweep restarts a run that
 * never started. That retry is the repair.
 *
 * Ids and counts only (`infra/temporal/README.md` §4): no person's data. The workflow id is the
 * event's meter and idempotency key — one call may meter two meters under its own id — so however often the event is dispatched it gets one run, and the step
 * inserts with `ON CONFLICT DO NOTHING`, so even a second run changes nothing.
 *
 * Its own queue, shared with the nightly gauge: a queue's steps are one registration in the api,
 * and metering must never wait behind the billing timers.
 */
export const usageRecordWorkflow = defineWorkflow({
  name: 'usageRecord',
  taskQueue: 'heliogrid-usage',
  input: z.object({
    eventId: z.string().uuid(),
    tenantId: z.string().uuid(),
    meter: z.enum(LEDGER_METERS),
    quantity: z.number().int().positive(),
    billable: z.boolean(),
    subjectKind: z.enum(SUBJECT_KINDS),
    subjectRef: z.string().uuid(),
    idempotencyKey: z.string().min(1).max(200),
    occurredAt: z.string().datetime(),
  }),
  result: z.object({ recorded: z.boolean() }),
  signals: {},
  queries: {},
  workflowId: (input) => `usage-${input.tenantId}-${input.meter}-${input.idempotencyKey}`,
});

/** What the step is told: the event as the producer wrote it. */
export type UsageRecordStepInput = Omit<z.infer<typeof usageRecordWorkflow.input>, 'eventId'>;

/** Whether this run wrote the row; `false` means it was already in the ledger. */
export type UsageRecordStepResult = WorkflowResult<typeof usageRecordWorkflow>;

export interface UsageRecordActivities {
  recordUsageEvent(input: UsageRecordStepInput): Promise<UsageRecordStepResult>;
}

/**
 * The nightly storage gauge (`M12-33`, `BM-20`): a Temporal Schedule runs this once a day, and its
 * step weighs every company's stored files, one page of companies at a time, into
 * `storage_gauge_snapshot`. A gauge is a reading, never a counter, so a second run on the same day
 * writes nothing.
 */
export const storageGaugeWorkflow = defineWorkflow({
  name: 'storageGauge',
  taskQueue: 'heliogrid-usage',
  input: z.object({}),
  result: z.object({ weighed: z.number().int().nonnegative() }),
  signals: {},
  queries: {},
  workflowId: () => 'storage-gauge',
});

/** The schedule's permanent id: one per cluster, created by the api when it is absent. */
export const STORAGE_GAUGE_SCHEDULE_ID = 'storage-gauge';

/** One page of companies weighed, and the id to start the next page after (`null`: the last). */
export interface StorageGaugePageResult {
  readonly weighed: number;
  readonly after: string | null;
}

/**
 * Which page to weigh, and when the run started: every page of one run is dated by that start, so
 * a run that crosses midnight UTC still writes one night's readings.
 */
export interface StorageGaugePage {
  readonly after: string | null;
  readonly runStartedAt: string;
}

export interface StorageGaugeActivities {
  weighStoragePage(page: StorageGaugePage): Promise<StorageGaugePageResult>;
}
