import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';
import { designLinks, readTaskLedger, TASK_ID, type TaskEntry } from './task-ledger';

/**
 * The task ledger agrees with itself and with history (`docs/tasks/README.md`, rule 0): a status is
 * one of its words, a struck task says so in its heading, `planned` and `designed` follow its
 * DESIGN links, a shipped task is named by a commit, every task a commit named still has its block
 * (a block can vanish in a conflict, and every other check then falls silent with it), and every
 * task id the task files and briefs cite exists.
 */
const STATUS_WORDS = /^(planned|designed|shipped|shipped \(#\d+\)|struck)$/;
const TASK_REFERENCE = new RegExp(`\\b${TASK_ID}[a-z]?\\b`, 'g');
const CITING_FILES = ['docs/tasks', 'docs/ux/briefs'];

export function findTaskLedgerProblems(repo: string): string[] {
  const { tasks } = readTaskLedger(repo);
  const subjects = execFileSync('git', ['log', 'HEAD', '--format=%s'], {
    cwd: repo,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (tasks.size === 0 || subjects === '') {
    throw new Error(
      'task-ledger-agrees: no tasks or no history read — a vacuous pass is worse than none',
    );
  }
  return [
    ...[...tasks].flatMap(([id, task]) => statusProblems(id, task, subjects)),
    ...vanishedTasks(tasks, subjects),
    ...danglingReferences(repo, tasks),
  ];
}

export function runTaskLedgerAgrees(repo: string): void {
  const problems = findTaskLedgerProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `task-ledger-agrees: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log(
    'task ledger agrees — every status, design link and cited task holds, nothing vanished',
  );
}

function statusProblems(id: string, task: TaskEntry, subjects: string): string[] {
  if (!STATUS_WORDS.test(task.status)) return [`${id}: "${task.status}" is not a status`];
  const state = task.status.split(' ')[0];
  const problems: string[] = [];
  if ((state === 'struck') !== task.title.startsWith('STRUCK')) {
    problems.push(`${id}: its heading and its Status disagree about whether it is struck`);
  }
  const links = designLinks(task).map(({ link }) => link);
  const pending = links.filter((link) => link === 'PENDING').length;
  if (state === 'planned' && links.length > 0 && pending === 0) {
    problems.push(`${id}: every DESIGN link is filled, so it is designed, not planned`);
  }
  if ((state === 'designed' || state === 'shipped') && pending > 0) {
    problems.push(`${id}: ${state} with a PENDING design`);
  }
  if (state === 'designed' && links.length === 0) {
    problems.push(`${id}: designed, but it carries no DESIGN line to be designed by`);
  }
  if (state === 'shipped' && !namesTask(subjects, id)) {
    problems.push(`${id}: shipped, but no commit on this branch names it`);
  }
  return problems;
}

/** A commit names a task by its id or by one of its parts' ids (`T-M01-005f`). */
function namesTask(subjects: string, id: string): boolean {
  return new RegExp(`\\b${id}[a-z]?\\b`).test(subjects);
}

function vanishedTasks(tasks: Map<string, TaskEntry>, subjects: string): string[] {
  const named = new Set([...subjects.matchAll(TASK_REFERENCE)].map((m) => baseId(m[0], tasks)));
  return [...named]
    .filter((id) => !tasks.has(id))
    .sort()
    .map((id) => `${id}: a commit names it, so it had a block — and no task file holds one now`);
}

function danglingReferences(repo: string, tasks: Map<string, TaskEntry>): string[] {
  return gitFiles(repo, CITING_FILES)
    .filter((file) => file.endsWith('.md'))
    .flatMap((file) =>
      readFileSync(join(repo, file), 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          [...line.matchAll(TASK_REFERENCE)]
            .map((m) => m[0])
            .filter((cited) => !tasks.has(baseId(cited, tasks)))
            .map((cited) => `${file}:${index + 1} cites ${cited}, which no task file holds`),
        ),
    );
}

/** A part's id (`T-M01-005f`) stands for its task, unless a task heading carries that very id. */
function baseId(cited: string, tasks: Map<string, TaskEntry>): string {
  return tasks.has(cited) ? cited : cited.replace(/[a-z]$/, '');
}
