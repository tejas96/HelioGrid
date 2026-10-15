import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';

/**
 * The task ledger as the task files hold it (`docs/tasks/README.md`, Task anatomy): each task's
 * `Status:` and header lines. Only task files hold tasks — the registers hold none — and a fenced
 * block is an example, never a task: README's own example task once overwrote the real one it
 * shares an id with.
 */
export const TASKS = 'docs/tasks';
const NOT_TASK_FILES = new Set([`${TASKS}/README.md`, `${TASKS}/deferred.md`, `${TASKS}/UI.md`]);
/** A task's id; a part adds its letter (`T-M01-005f`). Every ledger check builds on this one. */
export const TASK_ID = 'T-[A-Z0-9]+-\\d+';
export const SCREEN_ID = 'SCR-[A-Z0-9]+-\\d{2}';
const DESIGN_SCREEN = new RegExp(`(${SCREEN_ID})\\s*→\\s*`, 'g');
const FENCE = /^\s*```/;
const TASK_HEADING = new RegExp(`^### (${TASK_ID}[a-z]?) · (.*)$`);
const ANY_HIGHER_HEADING = /^#{1,3} /;
const STATUS = /^\*\*Status:\*\* (.+)$/;
/** A header line, `**Depends on:** …`; only those above the task's first `####` heading count. */
const HEADER_LINE = /^\*\*([A-Za-z][A-Za-z ]*):\*\*\s*(.*)$/;

export interface TaskEntry {
  status: string;
  file: string;
  line: number;
  /** The first line after the task: the next `#`–`###` heading outside a fence, or past the file's end. */
  endLine: number;
  /** The heading after the id, as written: `STRUCK …` marks a struck task. */
  title: string;
  /** Each header line by its label (`Type`, `Depends on`, `DESIGN`, `Design`, `Parked` …). */
  header: Map<string, string>;
  statusLines: number;
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
    };
  });
}

interface DesignLink {
  screen: string;
  link: string;
}

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
    (file) => file.endsWith('.md') && !NOT_TASK_FILES.has(file),
  );
}

/** One file's tasks, read line by line outside fenced blocks. */
function tasksIn(file: string, text: string): [string, TaskEntry][] {
  const found: [string, TaskEntry][] = [];
  const reading: Reading = { inFence: false, inHeaderLines: false };
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (FENCE.test(line)) reading.inFence = !reading.inFence;
    if (reading.inFence) return;
    if (ANY_HIGHER_HEADING.test(line)) closeTask(reading, index + 1);
    const opened = openedTask(file, line, index, lines.length + 1);
    if (opened !== undefined) {
      found.push(opened);
      Object.assign(reading, { task: opened[1], inHeaderLines: true });
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

/** Where the reader stands in a file: inside a fence, or a task's header lines. */
interface Reading {
  task?: TaskEntry;
  inFence: boolean;
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
  return [
    id,
    {
      file,
      line: index + 1,
      endLine: pastEnd,
      title,
      header: new Map(),
      status: '',
      statusLines: 0,
    },
  ];
}

function readTaskLine(reading: Reading, task: TaskEntry, line: string): void {
  if (line.startsWith('#### ')) reading.inHeaderLines = false;
  if (reading.inHeaderLines) recordHeaderLine(task, line);
  recordStatusLine(task, line);
}

/** A label written twice among the header lines keeps its first value. */
function recordHeaderLine(task: TaskEntry, line: string): void {
  const [, label, value] = HEADER_LINE.exec(line) ?? [];
  if (label !== undefined && value !== undefined && !task.header.has(label)) {
    task.header.set(label, value);
  }
}

function recordStatusLine(task: TaskEntry, line: string): void {
  const status = STATUS.exec(line)?.[1];
  if (status === undefined) return;
  task.statusLines += 1;
  if (task.status === '') task.status = status.trim();
}
