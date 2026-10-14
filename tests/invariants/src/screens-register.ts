import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The screen index of `docs/prd/registers/screens.md` (its section 2), read by column name, so a
 * column added at the end changes no reader. Each screen's `V` mark is the release it ships in:
 * the build order walks V1 only.
 */
export const SCREENS_REGISTER = 'docs/prd/registers/screens.md';
const INDEX_HEADING = /^## 2\./;
const ANY_SECTION = /^## /;
const HEADER_ROW = /^\| SCR \| Screen \|/;
const SCREEN_ROW = /^\| (SCR-[A-Z0-9]+-\d{2}) \|/;

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
  let inIndex = false;
  readFileSync(join(repo, SCREENS_REGISTER), 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (ANY_SECTION.test(line)) inIndex = INDEX_HEADING.test(line);
      if (!inIndex) return;
      if (HEADER_ROW.test(line)) columns = cellsOf(line);
      const id = SCREEN_ROW.exec(line)?.[1];
      if (id === undefined) return;
      const values = cellsOf(line);
      const cells = new Map<string, string>();
      columns.forEach((name, column) => {
        const value = values[column];
        if (value !== undefined) cells.set(name, value);
      });
      rows.push({ id, line: index + 1, cells });
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
