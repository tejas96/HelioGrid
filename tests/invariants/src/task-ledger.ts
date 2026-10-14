import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';

/**
 * The task ledger as the task files hold it (`docs/tasks/README.md`, Task anatomy): each task's
 * `Status:`, whether its build has begun, and the same for each row of its `#### Parts` table.
 * Only task files hold tasks — the registers and the archive hold none — and a fenced block is an
 * example, never a task: README's own example task once overwrote the real one it shares an id with.
 */
const TASKS = 'docs/tasks';
const NOT_TASK_FILES = new Set([`${TASKS}/README.md`, `${TASKS}/deferred.md`, `${TASKS}/UI.md`]);
const ARCHIVE = `${TASKS}/archive/`;
const FENCE = /^\s*```/;
const TASK_HEADING = /^### (T-[A-Z0-9]+-\d+[a-z]?) · /;
const ANY_HIGHER_HEADING = /^#{1,3} /;
const STATUS = /^\*\*Status:\*\* (.+)$/;
const PARTS_HEADING = /^#### Parts\s*$/;
/** A build begins with its RFC heading (`/task` step 0); a legacy task began with its `Plan`. */
const BUILD_HEADING = /^#### (?:RFC|Plan|Part ([a-z]) · RFC)\b/;
const PART_ROW = /^\| ([a-z]) \|.*\|([^|]*)\|\s*$/;

export interface PartEntry {
  status: string;
  begun: boolean;
}

export interface TaskEntry extends PartEntry {
  file: string;
  line: number;
  parts: Map<string, PartEntry>;
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
  let task: TaskEntry | undefined;
  let inFence = false;
  let partsTable: PartsTable = 'none';
  text.split('\n').forEach((line, index) => {
    if (FENCE.test(line)) inFence = !inFence;
    if (inFence) return;
    const heading = TASK_HEADING.exec(line);
    if (heading?.[1] !== undefined) {
      task = { file, line: index + 1, status: '', begun: false, parts: new Map() };
      found.push([heading[1], task]);
      partsTable = 'none';
      return;
    }
    if (ANY_HIGHER_HEADING.test(line)) task = undefined;
    if (task === undefined) return;
    partsTable = nextPartsTable(line, partsTable);
    if (partsTable === 'in rows') recordPart(task, line);
    else if (partsTable === 'none') recordTaskLine(task, line);
  });
  return found;
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

function recordTaskLine(task: TaskEntry, line: string): void {
  const status = STATUS.exec(line)?.[1];
  if (status !== undefined && task.status === '') task.status = status.trim();
  const build = BUILD_HEADING.exec(line);
  if (build === null) return;
  task.begun = true;
  const letter = build[1];
  if (letter === undefined) return;
  const part = task.parts.get(letter);
  task.parts.set(letter, { status: part?.status ?? 'open', begun: true });
}
