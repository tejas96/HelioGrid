import type {
  CATALOG_IMPORT_PHASES,
  CatalogImportStepResult,
} from '@heliogrid/contracts/workflows';
import { ActivityFailure } from '@temporalio/workflow';

/**
 * DETERMINISTIC CODE — replayed from history (`platform.workflows.ts` says what that forbids).
 *
 * The sequence every spreadsheet import shares (`M01-41`, `M02-18`): a
 * phase's step, and once it has failed past its retries, the step that ends the phase. Each
 * import's workflow proxies its own steps and hands them here, so the two imports run one
 * sequence. Changing the order of the steps called here changes every deployed import workflow's
 * history: it goes behind `patched()`.
 */

export type ImportPhase = (typeof CATALOG_IMPORT_PHASES)[number];

/** Where a step left the job — the one machine both imports walk. */
export type ImportStepResult = CatalogImportStepResult;

type Step = () => Promise<ImportStepResult>;

/** One import's six steps, each already bound to its job. */
export interface ImportPhaseSteps {
  /** Reads the stored file. */
  readonly read: Step;
  readonly endRead: Step;
  /** Judges the mapped rows into the preview. */
  readonly match: Step;
  readonly endMatch: Step;
  /** Writes the run's next batch; answers `running` while rows remain. */
  readonly applyRows: Step;
  readonly endRun: Step;
}

export async function runImportPhase(
  phase: ImportPhase,
  steps: ImportPhaseSteps,
): Promise<ImportStepResult> {
  switch (phase) {
    case 'read':
      return endedOnFailure(steps.read, steps.endRead);
    case 'match':
      return endedOnFailure(steps.match, steps.endMatch);
    case 'run':
      return endedOnFailure(() => everyBatch(steps.applyRows), steps.endRun);
  }
}

/** A phase's work, or — once a step has failed past its retries — the step that ends the phase. */
async function endedOnFailure(work: Step, end: Step): Promise<ImportStepResult> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ActivityFailure) return end();
    throw error;
  }
}

/**
 * One batch per step call until none is left: each call writes rows its batch has not, so every
 * call moves the run on and the loop ends with the sheet.
 */
async function everyBatch(applyRows: Step): Promise<ImportStepResult> {
  for (;;) {
    const applied = await applyRows();
    if (applied.status !== 'running') return applied;
  }
}
