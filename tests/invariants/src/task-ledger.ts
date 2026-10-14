import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';

/**
 * The task ledger as the task files hold it (`docs/tasks/README.md`, Task anatomy): each task's
 * `Status:`, whether its build has begun, and the same for each row of its `#### Parts` table.
 * Only task files hold tasks — the registers and the archive hold none — and a fenced block is an
 * example, never a task: README's own example task once overwrote the real one it shares an id with.
 */
export const TASKS = 'docs/tasks';
const NOT_TASK_FILES = new Set([`${TASKS}/README.md`, `${TASKS}/deferred.md`, `${TASKS}/UI.md`]);
const ARCHIVE = `${TASKS}/archive/`;
/** A task's id; a part adds its letter (`T-M01-005f`). Every ledger check builds on this one. */
export const TASK_ID = 'T-[A-Z0-9]+-\\d+';
export const SCREEN_ID = 'SCR-[A-Z0-9]+-\\d{2}';
const DESIGN_SCREEN = new RegExp(`(${SCREEN_ID})\\s*→\\s*`, 'g');
export const FENCE = /^\s*```/;
export const TASK_HEADING = new RegExp(`^### (${TASK_ID}[a-z]?) · (.*)$`);
const ANY_HIGHER_HEADING = /^#{1,3} /;
const STATUS = /^\*\*Status:\*\* (.+)$/;
const PARTS_HEADING = /^#### Parts\s*$/;
/** A build begins with its RFC heading (`/task` step 0); a legacy task began with its `Plan`. */
const BUILD_HEADING = /^#### (?:RFC|Plan|Part ([a-z]) · RFC)\b/;
/** A Parts row: its letter, then its last cell, the status. */
export const PART_ROW = /^\| ([a-z]) \|.*\|([^|]*)\|\s*$/;
/** A header line, `**Depends on:** …`; only those above the task's first `####` heading count. */
const HEADER_LINE = /^\*\*([A-Za-z][A-Za-z ]*):\*\*\s*(.*)$/;

export interface PartEntry {
  status: string;
  begun: boolean;
}

export interface TaskEntry extends PartEntry {
  file: string;
  line: number;
  /** The first line after the task: the next `#`–`###` heading outside a fence, or past the file's end. */
  endLine: number;
  /** The heading after the id, as written: `STRUCK …` marks a struck task. */
  title: string;
  /** Each header line by its label (`Type`, `Depends on`, `DESIGN`, `Design`, `Parked` …). */
  header: Map<string, string>;
  statusLines: number;
  parts: Map<string, PartEntry>;
}

/** Each screen a task's `DESIGN:` line names, with its board link, `PENDING` or `ported from …`. */
export function designLinks(task: TaskEntry): DesignLink[] {
  const value = task.header.get('DESIGN') ?? '';
  const screens = [...value.matchAll(DESIGN_SCREEN)];
  return screens.map((match, i) => {
    const from = (match.index ?? 0) + match[0].length;
    const segment = value.slice(from, screens[i + 1]?.index ?? value.length);
    return {
      screen: match[1] ?? '',
      link: segment.split(/\s/)[0] ?? '',
      alsoBoards: alsoBoards(segment),
    };
  });
}

export interface DesignLink {
  screen: string;
  link: string;
  /** The boards a screen keeps beside its main one, by name: `· also: States <link> · Language <link>`. */
  alsoBoards: string[];
}

function alsoBoards(segment: string): string[] {
  const at = segment.indexOf('also:');
  if (at < 0) return [];
  return segment
    .slice(at + 'also:'.length)
    .split(' · ')
    .map((entry) => entry.split(/\s+https?:\/\//)[0]?.trim() ?? '')
    .filter((name) => name !== '');
}

/** Where a `#### Parts` heading's table is: after the heading, prose may come before its rows. */
type PartsTable = 'none' | 'before rows' | 'in rows';

export interface TaskLedger {
  tasks: Map<string, TaskEntry>;
  problems: string[];
}

/** Every task in the task files, and every heading that cannot be one: a duplicate id or no status. */
export function readTaskLedger(repo: string): TaskLedger {
  const tasks = new Map<string, TaskEntry>();
  const firstHeading = new Map<string, string>();
  const problems: string[] = [];
  for (const file of taskFiles(repo)) {
    for (const [id, entry] of tasksIn(file, readFileSync(join(repo, file), 'utf8'))) {
      const here = `${file}:${entry.line}`;
      const first = firstHeading.get(id);
      if (first !== undefined) {
        problems.push(`${id} is defined twice: ${first} and ${here}`);
        continue;
      }
      firstHeading.set(id, here);
      if (entry.statusLines > 1)
        problems.push(`${id} at ${here} has ${entry.statusLines} **Status:** lines`);
      if (entry.status === '') problems.push(`${id} at ${here} has no **Status:** line`);
      else tasks.set(id, entry);
    }
  }
  return { tasks, problems };
}

function taskFiles(repo: string): string[] {
  return gitFiles(repo, [TASKS]).filter(
    (file) => file.endsWith('.md') && !NOT_TASK_FILES.has(file) && !file.startsWith(ARCHIVE),
  );
}

/** One file's tasks, read line by line outside fenced blocks. */
function tasksIn(file: string, text: string): [string, TaskEntry][] {
  const found: [string, TaskEntry][] = [];
  const reading: Reading = { inFence: false, partsTable: 'none', inHeaderLines: false };
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (FENCE.test(line)) reading.inFence = !reading.inFence;
    if (reading.inFence) return;
    if (ANY_HIGHER_HEADING.test(line)) closeTask(reading, index + 1);
    const opened = openedTask(file, line, index, lines.length + 1);
    if (opened !== undefined) {
      found.push(opened);
      Object.assign(reading, { task: opened[1], partsTable: 'none', inHeaderLines: true });
      return;
    }
    if (reading.task !== undefined) readTaskLine(reading, reading.task, line);
  });
  return found;
}

function closeTask(reading: Reading, line: number): void {
  if (reading.task !== undefined) reading.task.endLine = line;
  reading.task = undefined;
}

/** Where the reader stands in a file: inside a fence, a task's header lines, or its Parts table. */
interface Reading {
  task?: TaskEntry;
  inFence: boolean;
  partsTable: PartsTable;
  inHeaderLines: boolean;
}

function openedTask(
  file: string,
  line: string,
  index: number,
  pastEnd: number,
): [string, TaskEntry] | undefined {
  const heading = TASK_HEADING.exec(line);
  const id = heading?.[1];
  if (id === undefined) return undefined;
  const title = heading?.[2] ?? '';
  const task = {
    file,
    line: index + 1,
    endLine: pastEnd,
    title,
    header: new Map(),
    status: '',
    statusLines: 0,
    begun: false,
  };
  return [id, { ...task, parts: new Map() }];
}

function readTaskLine(reading: Reading, task: TaskEntry, line: string): void {
  if (line.startsWith('#### ')) reading.inHeaderLines = false;
  if (reading.inHeaderLines) recordHeaderLine(task, line);
  reading.partsTable = nextPartsTable(line, reading.partsTable);
  if (reading.partsTable === 'in rows') recordPart(task, line);
  else if (reading.partsTable === 'none') recordTaskLine(task, line);
}

/** The table ends at its first line that is not a row, and any heading ends the search for it. */
function nextPartsTable(line: string, current: PartsTable): PartsTable {
  if (PARTS_HEADING.test(line)) return 'before rows';
  if (current === 'none') return 'none';
  if (line.startsWith('|')) return 'in rows';
  if (current === 'before rows' && !line.startsWith('#')) return 'before rows';
  return 'none';
}

function recordPart(task: TaskEntry, line: string): void {
  const row = PART_ROW.exec(line);
  const [letter, status] = [row?.[1], row?.[2]?.trim()];
  if (letter === undefined || status === undefined) return;
  const part = task.parts.get(letter);
  task.parts.set(letter, { status, begun: part?.begun ?? false });
}

/** A label written twice among the header lines keeps its first value. */
function recordHeaderLine(task: TaskEntry, line: string): void {
  const [, label, value] = HEADER_LINE.exec(line) ?? [];
  if (label !== undefined && value !== undefined && !task.header.has(label)) {
    task.header.set(label, value);
  }
}

function recordTaskLine(task: TaskEntry, line: string): void {
  const status = STATUS.exec(line)?.[1];
  if (status !== undefined) task.statusLines += 1;
  if (status !== undefined && task.status === '') task.status = status.trim();
  const build = BUILD_HEADING.exec(line);
  if (build === null) return;
  task.begun = true;
  const letter = build[1];
  if (letter === undefined) return;
  const part = task.parts.get(letter);
  task.parts.set(letter, { status: part?.status ?? 'open', begun: true });
}
