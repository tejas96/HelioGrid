import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PART_ROW, readTaskLedger, TASK_HEADING, type TaskEntry } from './task-ledger';

/**
 * The build-order walk (`.claude/skills/task/references/walk.md`) reads each task's Parts rows with
 * its own `awk` command, because the walk is run by hand from the shell. Run over every task file,
 * that command must give exactly the parts and statuses this package's reader gives: a row it reads
 * outside a Parts table — an old copy in an RFC's Delivery size — or misses inside one picks the
 * wrong next step.
 */
const WALK = '.claude/skills/task/references/walk.md';
const WALK_COMMAND = /origin\/main:docs\/tasks\/<file>\.md \| awk '([^']+)'/;
const PRINTED_LINE = /^\d+: (.*)$/;

export function findWalkPartsProblems(repo: string): string[] {
  const program = WALK_COMMAND.exec(readFileSync(join(repo, WALK), 'utf8'))?.[1];
  if (program === undefined)
    return [
      `${WALK}: no \`git show origin/main:docs/tasks/<file>.md | awk '…'\` command reads the Parts rows`,
    ];
  const { tasks } = readTaskLedger(repo);
  const read = ledgerParts(tasks);
  if (read.size === 0) {
    throw new Error(
      'walk-reads-parts: the ledger holds no Parts row — a vacuous pass is worse than none',
    );
  }
  const files = new Set([...tasks.values()].map((task) => task.file));
  const walked = walkedParts(repo, program, files);
  const ids = new Set([...read.keys(), ...walked.keys()]);
  return [...ids].flatMap((id) => {
    const [byLedger, byWalk] = [read.get(id), walked.get(id)];
    if (byLedger === byWalk) return [];
    return [
      `${id}: the walk reads ${byWalk ?? 'no row'}, the task ledger reads ${byLedger ?? 'no row'}`,
    ];
  });
}

export function runWalkReadsParts(repo: string): void {
  const problems = findWalkPartsProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `walk-reads-parts: ${problems.length} problem(s) — the walk must read the Parts rows the ledger reads:\n  ${problems.join('\n  ')}`,
    );
  }
}

/** Each part's status by its id (`T-M01-030c`), as `readTaskLedger` reads it. */
function ledgerParts(tasks: Map<string, TaskEntry>): Map<string, string> {
  const parts = new Map<string, string>();
  for (const [id, task] of tasks) {
    for (const [letter, part] of task.parts) parts.set(`${id}${letter}`, part.status);
  }
  return parts;
}

/** Each part's status by its id, as the walk's command prints it from the files the ledger read. */
function walkedParts(repo: string, program: string, files: Set<string>): Map<string, string> {
  const parts = new Map<string, string>();
  for (const file of files) {
    const printed = execFileSync('awk', [program], {
      input: readFileSync(join(repo, file), 'utf8'),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    let task = '';
    for (const line of printed.split('\n')) {
      const text = PRINTED_LINE.exec(line)?.[1] ?? '';
      task = TASK_HEADING.exec(text)?.[1] ?? task;
      const row = PART_ROW.exec(text);
      if (row?.[1] !== undefined && row[2] !== undefined)
        parts.set(`${task}${row[1]}`, row[2].trim());
    }
  }
  return parts;
}
