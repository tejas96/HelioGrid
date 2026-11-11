import type { MarkWon } from '@heliogrid/contracts';
import { type ChecklistRow, checklistForDeal, formatDate, IN_PACK } from '@heliogrid/domain';
import { projectPackWords } from '@heliogrid/i18n';

/*
 * What every projects flow shares, web and phone: the India pack's own words for a stage, a
 * checklist row or a step, a date as the pack writes it, the rows a residential deal's project
 * carries, and what *Mark won* sends when a flow starts a project through the api. Kept apart from
 * Playwright, since `mobile-cli.ts` reads it too.
 */

/** The India pack's formats: what the board's words read a day and a stage from. */
export const PACK = IN_PACK.formats;

/** A stage's, a party's, a reason's, a row's or a step's word, as the India pack says it in English. */
export const packWord = projectPackWords(PACK, 'en');

/**
 * A day as the India pack writes it: a stored date, as the project pages hand it to their words, or
 * a calendar's own day, as its cell is named.
 */
export function packDay(date: string | Date): string {
  return formatDate(IN_PACK.formats, date, 'en');
}

/** The rows a residential deal's project carries, in the pack's order — the rows Mark won seeds. */
const RESIDENTIAL_CHECKLIST: readonly ChecklistRow[] = checklistForDeal(
  IN_PACK.formats.documentChecklist,
  IN_PACK.subsidy,
  'residential',
);
export const RESIDENTIAL_ROWS: readonly string[] = RESIDENTIAL_CHECKLIST.map((row) => row.row);

/** The rows a person fills — neither the payments nor the handover fills them in their place. */
const PERSON_ROWS = RESIDENTIAL_CHECKLIST.filter((row) => row.madeBy === undefined);

/** The first row still waiting on a person: the one the phone flow marks *Not needed*. */
export const FIRST_PERSON_ROW = rowAt(PERSON_ROWS, 0);

/** The first row handover still waits on once the first person's row is not needed. */
export const NEXT_WAITING_ROW = rowAt(
  RESIDENTIAL_CHECKLIST.filter((row) => row.madeBy !== 'handover' && row.row !== FIRST_PERSON_ROW),
  0,
);

/** The first install step the pack names: the one the crew ticks first. */
export const FIRST_STEP = IN_PACK.formats.installSteps[0]?.step ?? '';

/** The checklist's last row, which handover itself makes. */
export const LAST_ROW = rowAt(RESIDENTIAL_CHECKLIST, RESIDENTIAL_CHECKLIST.length - 1);

function rowAt(rows: readonly ChecklistRow[], index: number): string {
  const row = rows[index]?.row;
  if (row === undefined) throw new Error('the India pack carries no such checklist row');
  return row;
}

const DAY_MS = 86_400_000;

/**
 * *Mark won* as a flow sends it through the api (`POST /leads/:id/won`): a final value, and an
 * install date a month ahead — a day the company's clock has not passed in any runner's zone, so
 * the project asks for its next stage, never for a new date.
 */
export function markWonBody(managerId: string): MarkWon {
  return {
    finalValue: '350000',
    expectedInstallOn: new Date(Date.now() + 30 * DAY_MS).toISOString().slice(0, 10),
    managerId,
    capturedAt: new Date().toISOString(),
  };
}
