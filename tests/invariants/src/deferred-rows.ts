import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';
import { type PartEntry, readTaskLedger, type TaskEntry } from './task-ledger';

/**
 * Every deferred row can reopen (`docs/tasks/deferred.md`, its header): each part of its
 * `reopens when` cell is one of the four forms, every task, part and path it names exists, and a
 * row whose trigger has already fired is overdue — a `ships` whose task shipped, or a `starts` whose
 * task's build has begun — because nothing picked it up when it fired.
 */
const DEFERRED = 'docs/tasks/deferred.md';
const LOOKS_LIKE_A_ROW = /^\| D\d+ \|/;
const ROW = /^\| (D\d+) \|.*\| ([^|]+) \|\s*$/;
const NAMES_A_TASK = /^(T-[A-Z0-9]+-\d+)([a-z]?) (starts|ships)$/;
const TOUCHES = /^touches (\S+)$/;
const OWNER = /^owner: .+$/;
/** A struck task, or a part merged into another, never fires: its row would wait forever. */
const NEVER_FIRES = /^(struck|merged)/;

/** Every row part that cannot reopen, or is already overdue — a scan that reads nothing refuses. */
export function findDeferredRowProblems(repo: string): string[] {
  const { tasks, problems: ledgerProblems } = readTaskLedger(repo);
  const lines = readFileSync(join(repo, DEFERRED), 'utf8').split('\n');
  const rowLines = lines.filter((line) => LOOKS_LIKE_A_ROW.test(line));
  if (rowLines.length === 0 || tasks.size === 0) {
    throw new Error('deferred-rows: no rows or no tasks read — a vacuous pass is worse than none');
  }
  const filesInRepo = gitFiles(repo, ['.']);
  return [
    ...ledgerProblems,
    ...rowLines.flatMap((line) => {
      const row = ROW.exec(line);
      if (row === null) return [`${line.slice(0, 12)}…: a row whose cells cannot be read`];
      const [, id, cell] = row;
      return (cell ?? '')
        .split(' · ')
        .map((part) => part.replaceAll('`', '').trim())
        .flatMap((part) => problemsIn(`${id}`, part, tasks, filesInRepo));
    }),
  ];
}

export function runDeferredRows(repo: string): void {
  const problems = findDeferredRowProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `deferred-rows: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}\n\n  A cell is \`T-<id> starts\`, \`T-<id> ships\`, \`touches <path>\` or \`owner: <what>\`; an overdue row is decided, then joined to a task or given a new trigger.`,
    );
  }
  console.log('deferred rows — every row can reopen, names what exists, and none is overdue');
}

/** One part of a `reopens when` cell: a known form, naming what exists, and not already met. */
function problemsIn(
  id: string,
  part: string,
  tasks: Map<string, TaskEntry>,
  filesInRepo: readonly string[],
): string[] {
  const touched = TOUCHES.exec(part)?.[1];
  if (touched !== undefined) {
    return exists(touched, filesInRepo) ? [] : [`${id}: touches ${touched}, which does not exist`];
  }
  if (OWNER.test(part)) return [];
  const named = NAMES_A_TASK.exec(part);
  if (named === null) return [`${id}: "${part}" is none of the four forms`];
  const [, taskId = '', letter = '', event] = named;
  const name = `${taskId}${letter}`;
  const trigger = triggerFor(tasks, taskId, letter);
  if (trigger === undefined) return [`${id}: names ${name}, which no task file holds`];
  if (NEVER_FIRES.test(trigger.status)) {
    return [`${id}: names ${name}, which is ${trigger.status} and never fires`];
  }
  if (event === 'ships' && trigger.status.startsWith('shipped')) {
    return [`${id}: overdue — ${name} has shipped`];
  }
  if (event === 'starts' && (trigger.begun || trigger.status.startsWith('shipped'))) {
    return [`${id}: overdue — ${name} has started`];
  }
  return [];
}

/** A task by its heading, or a part by its row in its task's Parts table. */
function triggerFor(
  tasks: Map<string, TaskEntry>,
  taskId: string,
  letter: string,
): PartEntry | undefined {
  const asHeading = tasks.get(`${taskId}${letter}`);
  if (asHeading !== undefined) return asHeading;
  if (letter === '') return undefined;
  return tasks.get(taskId)?.parts.get(letter);
}

/** A file in the repo (tracked, or untracked and not ignored), or a folder, written with its `/`, holding one. */
function exists(path: string, filesInRepo: readonly string[]): boolean {
  return path.endsWith('/')
    ? filesInRepo.some((file) => file.startsWith(path))
    : filesInRepo.includes(path);
}
