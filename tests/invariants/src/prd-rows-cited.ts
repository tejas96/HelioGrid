import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type PrdRow, prdFiles, REGISTERS, ROW_ID, readPrdRows } from './prd-rows';
import { gitFiles } from './repo-files';
import { BRIEFS, readDispositions } from './screens-register';
import { readTaskLedger, SCREEN_ID, TASK_ID, TASKS } from './task-ledger';

/**
 * Every PRD row cited is a row the PRD still has, and every quote of one still says what its cell
 * says. A citation of a deleted row is legal only inside a dated removal record — the record of the
 * deletion — or a brief's amendment footnote, and a struck register row (`~~id~~`) may name it. A
 * quote may cut the cell short or add to its end; anything else is drift, however small. A shipped
 * or struck task's quotes are history and are not compared.
 */
const ROW_REFERENCE = new RegExp(`\\b(${ROW_ID})\\b`, 'g');
const MASKED_IDS = new RegExp(`\\b(?:${TASK_ID}[a-z]?|${SCREEN_ID})\\b`, 'g');
const QUOTE = new RegExp(`^\\s*-\\s*\\*\\*\`?(${ROW_ID})\`?\\*\\*\\s*\\([^)]*\\)\\s*—\\s*(.+)$`);
const AMENDMENT = /^\*(?:Amended |Note \(pre-flight)/;
const REMOVAL_RECORD =
  /\b(removed|deleted|struck|retired|swept|superseded|rehomed|repointed|re-pulled)\b.{0,120}\b20\d\d-\d\d-\d\d|\b20\d\d-\d\d-\d\d\b.{0,200}\b(removed|deleted|struck|retired|swept|superseded|rehomed|repointed|re-pulled|no longer exists)\b|previously (read|carried|listed|said|pointed)\b|\bthis (row|line|item|criterion|state) (was|is) (now )?(removed|deleted|struck)\b/i;
const FROZEN = /^(shipped|struck)/;

interface Source {
  file: string;
  lines: string[];
  /** Lines a dated removal record covers, or a struck register row: they may name a deleted row. */
  exempt: Set<number>;
}

export function findPrdCitationProblems(repo: string): string[] {
  const rows = readPrdRows(repo);
  const prefixes = new Set([...rows.keys()].map((id) => id.split('-')[0] ?? ''));
  const everRows = new Set(readDispositions(repo).map((d) => d.id));
  const isLive = (id: string): boolean => rows.has(id) || isClauseOfLiveRow(id, rows, everRows);
  return [
    ...sources(repo).flatMap((source) => deadCitations(source, isLive, prefixes)),
    ...driftedQuotes(repo, rows),
  ];
}

export function runPrdRowsCited(repo: string): void {
  const problems = findPrdCitationProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `prd-rows-cited: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log('prd rows cited — every cited row is live, every quote matches its cell');
}

/** The task files, the briefs above their footnotes, the PRD itself and its registers. */
function sources(repo: string): Source[] {
  const read = (file: string): string[] => readFileSync(join(repo, file), 'utf8').split('\n');
  const taskFiles = gitFiles(repo, [TASKS]).filter((f) => /^docs\/tasks\/[^/]+\.md$/.test(f));
  const briefs = gitFiles(repo, [BRIEFS]).filter((f) => f.endsWith('.md'));
  const registers = gitFiles(repo, [REGISTERS]).filter((f) => f.endsWith('.md'));
  return [
    ...[...taskFiles, ...prdFiles(repo)].map((file) => withRecords(file, read(file))),
    ...briefs.map((file) => {
      const lines = read(file);
      const footnote = lines.findIndex((line) => AMENDMENT.test(line));
      return {
        file,
        lines: footnote < 0 ? lines : lines.slice(0, footnote),
        exempt: new Set<number>(),
      };
    }),
    ...registers.map((file) => {
      const source = withRecords(file, read(file));
      source.lines.forEach((line, index) => {
        if (line.includes('~~')) source.exempt.add(index);
      });
      return source;
    }),
  ];
}

/**
 * A record often runs several sentences, its date in any of them: the whole paragraph is exempt. A
 * table has no blank line, so each table row is its own paragraph, or one dated row would exempt its
 * whole table.
 */
function withRecords(file: string, lines: string[]): Source {
  const exempt = new Set<number>();
  let paragraph: number[] = [];
  const close = (): void => {
    const text = paragraph
      .map((i) => lines[i])
      .join(' ')
      .replace(/\s+/g, ' ');
    if (REMOVAL_RECORD.test(text)) for (const i of paragraph) exempt.add(i);
    paragraph = [];
  };
  lines.forEach((line, index) => {
    const isTableRow = line.startsWith('|');
    if (line.trim() === '' || isTableRow) close();
    if (line.trim() !== '') paragraph.push(index);
    if (isTableRow) close();
  });
  close();
  return { file, lines, exempt };
}

function deadCitations(
  source: Source,
  isLive: (id: string) => boolean,
  prefixes: Set<string>,
): string[] {
  return source.lines.flatMap((line, index) => {
    if (source.exempt.has(index)) return [];
    const unmasked = line.replace(MASKED_IDS, ' ');
    return [...new Set([...unmasked.matchAll(ROW_REFERENCE)].map((m) => m[1] ?? ''))]
      .filter((id) => prefixes.has(id.split('-')[0] ?? '') && !isLive(id))
      .map((id) => `${source.file}:${index + 1} cites ${id}, which the PRD no longer carries`);
  });
}

/**
 * `F2-08a` is clause a of the live row `F2-08` — unless that id was ever a row of its own, as
 * `MS7-24b` is: §3 lands every row the PRD ever had, deleted ones struck, so its deletion stays seen.
 */
function isClauseOfLiveRow(id: string, rows: Map<string, PrdRow>, everRows: Set<string>): boolean {
  return /[a-z]$/.test(id) && !everRows.has(id) && rows.has(id.slice(0, -1));
}

function driftedQuotes(repo: string, rows: Map<string, PrdRow>): string[] {
  const frozen = frozenRanges(repo);
  const files = gitFiles(repo, [TASKS, BRIEFS]).filter((f) =>
    /^docs\/(tasks|ux\/briefs)\/[^/]+\.md$/.test(f),
  );
  return files.flatMap((file) =>
    readFileSync(join(repo, file), 'utf8')
      .split('\n')
      .flatMap((line, index) => {
        const [, id, quote] = QUOTE.exec(line) ?? [];
        const row = id === undefined ? undefined : rows.get(id);
        if (row === undefined || quote === undefined || inFrozen(frozen, file, index + 1))
          return [];
        return quoteMatches(quote, row.cell)
          ? []
          : [`${file}:${index + 1} quotes ${id}, and its PRD cell now says otherwise`];
      }),
  );
}

/** Equal, a cut of the cell, or the cell plus a suffix (`— Enforced by: …`). */
function quoteMatches(quote: string, cell: string): boolean {
  const [a, b] = [plain(quote), plain(cell)];
  return a === b || b.startsWith(a) || a.startsWith(b);
}

function plain(text: string): string {
  return text
    .replace(/`|\*\*|\*|_/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Each shipped or struck task's own lines, `file → [first, end)`; a file's `## Laws` stay live. */
function frozenRanges(repo: string): Map<string, [number, number][]> {
  const ranges = new Map<string, [number, number][]>();
  for (const task of readTaskLedger(repo).tasks.values()) {
    if (!FROZEN.test(task.status)) continue;
    ranges.set(task.file, [...(ranges.get(task.file) ?? []), [task.line, task.endLine]]);
  }
  return ranges;
}

function inFrozen(ranges: Map<string, [number, number][]>, file: string, line: number): boolean {
  return (ranges.get(file) ?? []).some(([first, end]) => line >= first && line < end);
}
