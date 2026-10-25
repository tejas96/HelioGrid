import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gitFiles } from './repo-files';
import { TASKS, taskFiles } from './task-ledger';

/**
 * An RFC's proofs and its deferred rows hold before its commit (`/task` steps 5 and 8): every test a
 * `main-dev` proof row names exists in the file it names, and every row its Proof section lists as
 * `Deleted:` is gone from `docs/tasks/deferred.md`. Only an RFC section that differs from the
 * branch's base on `origin/main` is read — the one being built; an RFC already on main is a part in flight whose
 * later tests do not exist yet, and an RFC that left for its PR body is no longer here.
 */
const RFC_HEADING = /^#### (?:Part [a-z] · )?RFC\s*$/;
const NEXT_SECTION = /^#{1,4} /;
const DEFERRED = `${TASKS}/deferred.md`;
/** `` `path` `` sets the file; each ` › *title*` after it names one test in that file. */
const PROOF_TOKEN = /`([^`]+\.(?:test|spec)\.tsx?)`|›\s*\*([^*]+)\*/g;
const DELETED_LINE = /\*\*Deleted:\*\*([^\n]*)/;
const ROW_ID = /\bD\d+\b/g;
const MAIN_DEV = /\|\s*main-dev\s*\|/;

interface RfcSection {
  file: string;
  line: number;
  text: string;
}

export function findRfcProofProblems(repo: string): string[] {
  const files = taskFiles(repo);
  if (files.length === 0) throw new Error(`rfc-proofs-hold: no task files under ${TASKS}`);
  const tests = gitFiles(repo, ['apps', 'packages', 'tests']).filter((file) =>
    /\.(?:test|spec)\.tsx?$/.test(file),
  );
  const deferredIds = new Set(
    readFileSync(join(repo, DEFERRED), 'utf8')
      .split('\n')
      .flatMap((line) => /^\| (D\d+) \|/.exec(line)?.[1] ?? []),
  );
  return files
    .flatMap((file) => changedRfcSections(repo, file))
    .flatMap((section) => [
      ...missingTests(repo, section, tests),
      ...deferredRowsLeft(section, deferredIds),
    ]);
}

export function runRfcProofsHold(repo: string): void {
  const problems = findRfcProofProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `rfc-proofs-hold: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log(
    'rfc proofs hold — every test a changed RFC names exists, every row it deletes is gone',
  );
}

/** The RFC sections of `file` whose text the branch's base on `origin/main` does not hold. */
function changedRfcSections(repo: string, file: string): RfcSection[] {
  const here = rfcSections(file, readFileSync(join(repo, file), 'utf8'));
  const onMain = new Set(rfcSections(file, mainText(repo, file)).map((section) => section.text));
  return here.filter((section) => !onMain.has(section.text));
}

/**
 * The file at the branch's merge base with `origin/main` — not main's tip, which may since have
 * dropped an RFC this branch still holds unchanged; empty when there is no such file or no
 * `origin/main`.
 */
function mainText(repo: string, file: string): string {
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    return git(['show', `${git(['merge-base', 'HEAD', 'origin/main']).trim()}:${file}`]);
  } catch {
    return '';
  }
}

function rfcSections(file: string, text: string): RfcSection[] {
  const lines = text.split('\n');
  const sections: RfcSection[] = [];
  lines.forEach((line, index) => {
    if (!RFC_HEADING.test(line)) return;
    const end = lines.findIndex((next, at) => at > index && NEXT_SECTION.test(next));
    const body = lines.slice(index, end < 0 ? lines.length : end).join('\n');
    sections.push({ file, line: index + 1, text: body });
  });
  return sections;
}

/** Each `main-dev` proof row's named test, missing from the file the row names. */
function missingTests(repo: string, section: RfcSection, tests: readonly string[]): string[] {
  const where = `${section.file}:${section.line}`;
  return section.text
    .split('\n')
    .filter((line) => line.trimStart().startsWith('|') && MAIN_DEV.test(line))
    .flatMap((row) => rowProblems(repo, where, row, tests));
}

/** One row: each `` `file` `` must be one test file, each title after it a test in that file. */
function rowProblems(repo: string, where: string, row: string, tests: readonly string[]): string[] {
  const problems: string[] = [];
  let path: string | null = null;
  let named = 0;
  for (const [, file, title] of row.matchAll(PROOF_TOKEN)) {
    if (file !== undefined) {
      path = resolveTest(file, tests);
      if (path === null) problems.push(`${where}: \`${file}\` is not one test file`);
      continue;
    }
    if (title === undefined || path === null) continue;
    named += 1;
    if (!holdsTitle(repo, path, title)) {
      problems.push(`${where}: \`${path}\` has no test named "${title.trim()}"`);
    }
  }
  if (named === 0 && problems.length === 0) {
    problems.push(
      `${where}: a main-dev row names no \`<file>\` › *<title>*: ${row.trim().slice(0, 80)}`,
    );
  }
  return problems;
}

/** A path with a folder is read as written; a bare name must match exactly one test file. */
function resolveTest(named: string, tests: readonly string[]): string | null {
  if (named.includes('/')) {
    return tests.find((file) => file === named || file.endsWith(`/${named}`)) ?? null;
  }
  const found = tests.filter((file) => file.endsWith(`/${named}`));
  return found.length === 1 ? (found[0] ?? null) : null;
}

/**
 * The title's words, up to a trailing ellipsis, open a string in the test file — a test's, a
 * describe's or a table row's title — never a comment or the middle of another title.
 */
function holdsTitle(repo: string, path: string, title: string): boolean {
  const words = fold(title.replace(/(?:…|\.\.\.)\s*$/u, '').trim());
  if (words === '') return false;
  const text = fold(readFileSync(join(repo, path), 'utf8'));
  return ["'", '"', '`'].some((quote) => text.includes(`${quote}${words}`));
}

function fold(text: string): string {
  return text.replace(/[‘’]/gu, "'").replace(/[“”]/gu, '"');
}

/** Each row the RFC's `**Deleted:**` line lists that `deferred.md` still holds. */
function deferredRowsLeft(section: RfcSection, deferredIds: ReadonlySet<string>): string[] {
  const listed = DELETED_LINE.exec(section.text)?.[1] ?? '';
  return [...listed.matchAll(ROW_ID)]
    .map(([id]) => id)
    .filter((id) => deferredIds.has(id))
    .map(
      (id) =>
        `${section.file}:${section.line}: ${id} is listed as Deleted but is still in ${DEFERRED}`,
    );
}
