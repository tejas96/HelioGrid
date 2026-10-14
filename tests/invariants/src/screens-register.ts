import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROW_ID } from './prd-rows';

/**
 * `docs/prd/registers/screens.md`: its screen index (section 2), read by column name so a column
 * added at the end changes no reader — each screen's `V` mark is the release it ships in, and the
 * build order walks V1 only; its row dispositions (section 3), where every PRD row lands, a struck
 * row written `~~id~~`; and the V1 scope lock, the one line that states how many screens each
 * release holds.
 */
export const SCREENS_REGISTER = 'docs/prd/registers/screens.md';
export const BRIEFS = 'docs/ux/briefs';
const INDEX_HEADING = /^## 2\./;
const DISPOSITIONS_HEADING = /^## 3\./;
const ANY_SECTION = /^## /;
const HEADER_ROW = /^\| SCR \| Screen \|/;
const SCREEN_ROW = /^\| (SCR-[A-Z0-9]+-\d{2}) \|/;
const DISPOSITION_ROW = new RegExp(`^\\|\\s*(~~)?\`?(${ROW_ID})\`?(?:~~)?\\s*\\|`);
const SCOPE_LOCK = /\*\*`V1` = (\d+) screens · `V2` = (\d+) · (\d+) total\.\*\*/;

export interface Disposition {
  id: string;
  line: number;
  struck: boolean;
}

/** Every row of section 3: where a PRD row lands, or `~~id~~` for a row the PRD struck or deleted. */
export function readDispositions(repo: string): Disposition[] {
  const found: Disposition[] = [];
  linesOfSection(repo, DISPOSITIONS_HEADING).forEach(([line, text]) => {
    const [, struck, id] = DISPOSITION_ROW.exec(text) ?? [];
    if (id !== undefined) found.push({ id, line, struck: struck !== undefined });
  });
  if (found.length === 0) {
    throw new Error(
      `${SCREENS_REGISTER}: no row disposition read — a vacuous pass is worse than none`,
    );
  }
  return found;
}

/** The scope lock's stated counts, or `undefined` when no line states them. */
export function readScopeLock(repo: string): { v1: number; v2: number; total: number } | undefined {
  const [, v1, v2, total] =
    SCOPE_LOCK.exec(readFileSync(join(repo, SCREENS_REGISTER), 'utf8')) ?? [];
  if (v1 === undefined || v2 === undefined || total === undefined) return undefined;
  return { v1: Number(v1), v2: Number(v2), total: Number(total) };
}

/** Each `[line number, text]` of one `## ` section. */
function linesOfSection(repo: string, heading: RegExp): [number, string][] {
  let inSection = false;
  return readFileSync(join(repo, SCREENS_REGISTER), 'utf8')
    .split('\n')
    .flatMap((text, index): [number, string][] => {
      if (ANY_SECTION.test(text)) inSection = heading.test(text);
      return inSection ? [[index + 1, text]] : [];
    });
}

export interface ScreenRow {
  id: string;
  line: number;
  /** Each cell by its column's name (`Brief`, `V` …); a missing cell is absent. */
  cells: Map<string, string>;
}

/** Every row of the screen index; a register with no index refuses. */
export function readScreenIndex(repo: string): ScreenRow[] {
  const rows: ScreenRow[] = [];
  let columns: string[] = [];
  linesOfSection(repo, INDEX_HEADING).forEach(([line, text]) => {
    if (HEADER_ROW.test(text)) columns = cellsOf(text);
    const id = SCREEN_ROW.exec(text)?.[1];
    if (id === undefined) return;
    const values = cellsOf(text);
    const cells = new Map<string, string>();
    columns.forEach((name, column) => {
      const value = values[column];
      if (value !== undefined) cells.set(name, value);
    });
    rows.push({ id, line, cells });
  });
  if (rows.length === 0) {
    throw new Error(
      `${SCREENS_REGISTER}: no screen index read — a vacuous pass is worse than none`,
    );
  }
  return rows;
}

function cellsOf(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}
