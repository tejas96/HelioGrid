import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';

/**
 * The PRD's requirement rows — the one source of truth for a requirement — read from every table of
 * `docs/prd/**` but its registers, which only point at them. A row struck in place keeps its id and
 * says `STRUCK` in its cell; a row deleted outright is simply gone.
 */
export const ROW_ID = '[A-Z]{1,3}[0-9]{0,2}[A-Z]*-\\d{2,3}[a-z]?';
const PRD = 'docs/prd';
export const REGISTERS = `${PRD}/registers/`;
const ROW_LINE = new RegExp(`^\\|\\s*\`?(${ROW_ID})\`?\\s*\\|([^|]*)`);
const STRUCK_CELL = /^\**STRUCK/i;

export interface PrdRow {
  file: string;
  line: number;
  /** The row's requirement cell, as written. */
  cell: string;
  struck: boolean;
}

/** Every requirement row by id; the first table that writes an id owns it. */
export function readPrdRows(repo: string): Map<string, PrdRow> {
  const rows = new Map<string, PrdRow>();
  for (const file of prdFiles(repo)) {
    readFileSync(join(repo, file), 'utf8')
      .split('\n')
      .forEach((text, index) => {
        const [, id, rawCell] = ROW_LINE.exec(text) ?? [];
        if (id === undefined || rawCell === undefined || rows.has(id)) return;
        const cell = rawCell.trim();
        rows.set(id, { file, line: index + 1, cell, struck: STRUCK_CELL.test(cell) });
      });
  }
  if (rows.size === 0) {
    throw new Error(`${PRD}: no requirement row read — a vacuous pass is worse than none`);
  }
  return rows;
}

/** The PRD's own documents, its registers left out. */
export function prdFiles(repo: string): string[] {
  return gitFiles(repo, [PRD])
    .filter((file) => file.endsWith('.md') && !file.startsWith(REGISTERS))
    .sort();
}
