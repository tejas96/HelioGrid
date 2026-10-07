import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';

/**
 * Every deferred row can reopen (`docs/tasks/deferred.md`, its header): each part of its
 * `reopens when` cell is one of the four forms, every task it names exists, and a row whose task
 * has already shipped is overdue — it was due when that task shipped and nothing picked it up.
 */
const DEFERRED = 'docs/tasks/deferred.md';
const TASKS = 'docs/tasks';
const ROW = /^\| (D\d+) \|.*\| ([^|]+) \|\s*$/;
const TASK_HEADING = /^### (T-[A-Z0-9]+-\d+[a-z]?) · .*\n(?:.*\n){0,4}?\*\*Status:\*\* ([^\n]+)/gm;
const NAMES_A_TASK = /^(T-[A-Z0-9]+-\d+[a-z]?) (starts|ships)$/;
const OTHER_FORMS = [/^touches \S+$/, /^owner: .+$/];

/** Every row part that cannot reopen, or is already overdue — a scan that reads nothing refuses. */
export function findDeferredRowProblems(repo: string): string[] {
  const tasks = taskStatuses(repo);
  const rows = readFileSync(join(repo, DEFERRED), 'utf8')
    .split('\n')
    .map((line) => ROW.exec(line))
    .filter((match) => match !== null);
  if (rows.length === 0 || tasks.size === 0) {
    throw new Error('deferred-rows: no rows or no tasks read — a vacuous pass is worse than none');
  }
  return rows.flatMap(([, id, cell]) =>
    (cell ?? '')
      .split(' · ')
      .map((part) => part.replaceAll('`', '').trim())
      .flatMap((part) => problemsIn(`${id}`, part, tasks)),
  );
}

export function runDeferredRows(repo: string): void {
  const problems = findDeferredRowProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `deferred-rows: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}\n\n  A cell is \`T-<id> starts\`, \`T-<id> ships\`, \`touches <path>\` or \`owner: <what>\`; an overdue row is decided, then joined to a task or rewritten.`,
    );
  }
  console.log('deferred rows — every row can reopen, none overdue');
}

/** Each task's id and its `Status:` line, read from the task files. */
function taskStatuses(repo: string): Map<string, string> {
  const statuses = new Map<string, string>();
  for (const file of gitFiles(repo, [TASKS]).filter((name) => name.endsWith('.md'))) {
    for (const [, id, status] of readFileSync(join(repo, file), 'utf8').matchAll(TASK_HEADING)) {
      if (id !== undefined && status !== undefined) statuses.set(id, status.trim());
    }
  }
  return statuses;
}

/** One part of a `reopens when` cell: a known form, a task that exists, and not already met. */
function problemsIn(id: string, part: string, tasks: Map<string, string>): string[] {
  const named = NAMES_A_TASK.exec(part);
  if (named === null) {
    return OTHER_FORMS.some((form) => form.test(part))
      ? []
      : [`${id}: "${part}" is none of the four forms`];
  }
  const [, task, event] = named;
  const status = tasks.get(task ?? '');
  if (status === undefined) return [`${id}: names ${task}, which no task file holds`];
  if (event === 'ships' && status.startsWith('shipped')) {
    return [`${id}: overdue — ${task} has shipped`];
  }
  return [];
}
