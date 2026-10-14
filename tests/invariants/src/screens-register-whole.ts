import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { type PrdRow, readPrdRows } from './prd-rows';
import { gitFiles } from './repo-files';
import {
  BRIEFS,
  type Disposition,
  readDispositions,
  readScopeLock,
  readScreenIndex,
  SCREENS_REGISTER,
  type ScreenRow,
} from './screens-register';
import { designLinks, readTaskLedger } from './task-ledger';

/**
 * The screens register is whole (`docs/prd/registers/screens.md`): every screen has one brief and
 * at least one task that designs it — a later task may rework a drawn screen — and nothing designs
 * or briefs a screen it does not hold; every live PRD row lands exactly once, a row the PRD struck
 * or deleted is marked struck here, and no landing names a row the PRD never had; and every screen
 * is V1 or V2, in the counts the scope lock states.
 */
const BRIEF_FILE = /^docs\/ux\/briefs\/(SCR-[A-Z0-9]+-\d{2})(?:-.*)?\.md$/;
const RELEASES = new Set(['V1', 'V2']);

export function findScreensRegisterProblems(repo: string): string[] {
  const screens = readScreenIndex(repo);
  return [
    ...briefProblems(repo, screens),
    ...designProblems(repo, new Set(screens.map((s) => s.id))),
    ...dispositionProblems(repo),
    ...scopeProblems(repo, screens),
  ];
}

export function runScreensRegisterWhole(repo: string): void {
  const problems = findScreensRegisterProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `screens-register-whole: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log(
    'screens register whole — every screen briefed and designed, every PRD row landed once',
  );
}

function briefProblems(repo: string, screens: ScreenRow[]): string[] {
  const briefFiles = gitFiles(repo, [BRIEFS]).flatMap((file) => BRIEF_FILE.exec(file)?.[1] ?? []);
  const briefed = new Set(briefFiles);
  const held = new Set(screens.map((s) => s.id));
  return [
    ...[...briefed]
      .filter((id) => briefFiles.filter((other) => other === id).length > 1)
      .map((id) => `${id} has more than one brief in ${BRIEFS}`),
    ...screens.filter((s) => !briefed.has(s.id)).map((s) => `${s.id} has no brief in ${BRIEFS}`),
    ...[...briefed]
      .filter((id) => !held.has(id))
      .map((id) => `${BRIEFS} briefs ${id}, which the register does not hold`),
    ...screens.flatMap((s) => {
      const path = (s.cells.get('Brief') ?? '').replaceAll('`', '');
      return existsSync(join(repo, path))
        ? []
        : [`${s.id}'s Brief cell names ${path || 'nothing'}, which does not exist`];
    }),
  ];
}

function designProblems(repo: string, held: Set<string>): string[] {
  const designed = new Set(
    [...readTaskLedger(repo).tasks.values()].flatMap((t) => designLinks(t).map((d) => d.screen)),
  );
  return [
    ...[...held]
      .filter((id) => !designed.has(id))
      .map((id) => `${id} has no task whose DESIGN line names it`),
    ...[...designed]
      .filter((id) => !held.has(id))
      .map((id) => `a task's DESIGN line names ${id}, which the register does not hold`),
  ];
}

function dispositionProblems(repo: string): string[] {
  const rows = readPrdRows(repo);
  const landings = readDispositions(repo);
  return [
    ...unlandedRows(rows, landings),
    ...repeatedLandings(landings),
    ...wrongLandings(rows, landings),
  ];
}

/** A live row lands somewhere, and a row the PRD struck is struck here too. */
function unlandedRows(rows: Map<string, PrdRow>, landings: Disposition[]): string[] {
  const landed = new Set(landings.map((l) => l.id));
  const struckHere = new Set(landings.filter((l) => l.struck).map((l) => l.id));
  return [...rows].flatMap(([id, row]) => {
    if (!row.struck && !landed.has(id))
      return [`${id} is a live PRD row and lands nowhere in ${SCREENS_REGISTER} §3`];
    if (row.struck && !struckHere.has(id))
      return [`${id} is struck in the PRD and not struck in §3`];
    return [];
  });
}

function repeatedLandings(landings: Disposition[]): string[] {
  const count = new Map<string, number>();
  for (const { id } of landings) count.set(id, (count.get(id) ?? 0) + 1);
  return [...count]
    .filter(([, times]) => times > 1)
    .map(([id, times]) => `${id} lands ${times} times in §3 — a row lands exactly once`);
}

function wrongLandings(rows: Map<string, PrdRow>, landings: Disposition[]): string[] {
  return landings.flatMap(({ id, line, struck }) => {
    const row = rows.get(id);
    const where = `${SCREENS_REGISTER}:${line}`;
    if (!struck && row === undefined) return [`${where} lands ${id}, which the PRD never had`];
    if (struck && row !== undefined && !row.struck)
      return [`${where} strikes ${id}, which the PRD still carries`];
    if (!struck && row?.struck) return [`${where} lands ${id} as live, but the PRD struck it`];
    return [];
  });
}

function scopeProblems(repo: string, screens: ScreenRow[]): string[] {
  const lock = readScopeLock(repo);
  if (lock === undefined)
    return [`${SCREENS_REGISTER} states no scope lock (\`V1\` = n screens · \`V2\` = n · n total)`];
  const problems = screens
    .filter((s) => !RELEASES.has(s.cells.get('V') ?? ''))
    .map((s) => `${s.id} is marked neither V1 nor V2`);
  const marked = (release: string): number =>
    screens.filter((s) => s.cells.get('V') === release).length;
  const counted = { v1: marked('V1'), v2: marked('V2'), total: screens.length };
  for (const key of ['v1', 'v2', 'total'] as const) {
    if (counted[key] !== lock[key]) {
      problems.push(
        `the scope lock states ${key} = ${lock[key]}, and the index holds ${counted[key]} — move the lock with an owner ruling, or the marks back`,
      );
    }
  }
  return problems;
}
