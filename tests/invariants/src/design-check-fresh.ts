import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readScreenIndex } from './screens-register';
import {
  type DesignLink,
  designLinks,
  FENCE,
  readTaskLedger,
  SCREEN_ID,
  type TaskEntry,
} from './task-ledger';

/**
 * An open screen task's design check still stands on what it was read against, and every
 * `against code` finding has the owner's ruling before the task's first RFC (`/task` step 3). Each
 * check entry ends in one `Read:` line per screen it designs, naming the brief's, the decisions
 * record's and every board's digest — the first 12 hex of its sha256 — or `over the read cap` for
 * a board too large to read. The record and boards live outside the repo, so only the brief is
 * compared here; their digests name the picture folder, so a changed one starts an empty folder.
 */
const OPEN = /^(planned|designed)$/;
const DESIGN_CHECK = /^#### Design check\s*$/;
const NEXT_SECTION = /^#{1,4} /;
const READ_LINE = new RegExp(`^Read: \`(${SCREEN_ID})\` · (.+)$`);
const BRIEF = /\bbrief sha256:([0-9a-f]{12})\b/;
const RECORD = /\brecord sha256:[0-9a-f]{12}\b/;
const BOARD = /\bboard (.+?) (?:sha256:[0-9a-f]{12}|over the read cap)(?= · |$)/g;
const MAIN_BOARD = 'main';
const RULING_HEADER = /^\|\s*frame\s*\|\s*the board\s*\|\s*the code\s*\|\s*ruling\s*\|\s*$/i;
const FRAME_TABLE = /^\|\s*frame\s*\|/i;
/** A ruling is the owner's decision, written `ruled: …`; a helper's `board` or `code` is a suggestion. */
const RULED = /^ruled:\s*\S/i;

/**
 * Checks written before the `Read:` line and the ruling table existed, held by name until their
 * next entry adds them; a held task that ships or gains a `Read:` line fails, so the list only shrinks.
 */
const HELD: ReadonlyMap<string, string> = new Map([
  [
    'T-M01-005',
    'its check predates the Read: line and its brief took rulings during its own parts; its against-code table predates the fixed header, its rulings being in its parts’ RFC Decisions — part o’s entry adds the Read: line',
  ],
]);

interface Check {
  id: string;
  task: TaskEntry;
  section: [number, string][];
}

export function findDesignCheckProblems(repo: string): string[] {
  const { tasks } = readTaskLedger(repo);
  if (tasks.size === 0) {
    throw new Error('design-check-fresh: no task read — a vacuous pass is worse than none');
  }
  const briefOf = new Map(
    readScreenIndex(repo).map((s) => [s.id, (s.cells.get('Brief') ?? '').replaceAll('`', '')]),
  );
  const checks = [...tasks]
    .filter(([, task]) => OPEN.test(task.status))
    .flatMap(([id, task]): Check[] => {
      const section = designCheckOf(repo, task);
      return section === undefined ? [] : [{ id, task, section }];
    });
  return [
    ...checks.flatMap((check) => freshness(repo, check, briefOf)),
    ...checks.flatMap((check) => unruled(check)),
    ...staleHolds(checks),
  ];
}

export function runDesignCheckFresh(repo: string): void {
  const problems = findDesignCheckProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `design-check-fresh: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log('design checks fresh — every open check stands on its briefs, every finding ruled');
}

/** The task's `#### Design check` lines outside fences, `[line number, text]`, or `undefined`. */
function designCheckOf(repo: string, task: TaskEntry): [number, string][] | undefined {
  const lines = readFileSync(join(repo, task.file), 'utf8').split('\n');
  const start = lines.findIndex(
    (text, i) => i >= task.line && i < task.endLine && DESIGN_CHECK.test(text),
  );
  if (start < 0) return undefined;
  const section: [number, string][] = [];
  let inFence = false;
  for (let i = start + 1; i < task.endLine - 1; i++) {
    const text = lines[i] ?? '';
    if (FENCE.test(text)) inFence = !inFence;
    if (inFence || FENCE.test(text)) continue;
    if (NEXT_SECTION.test(text)) break;
    section.push([i + 1, text]);
  }
  return section;
}

/** Each drawn screen's last `Read:` line names its brief as it is now, its record and every board; a `PENDING` or ported screen has no board to read. */
function freshness(
  repo: string,
  { id, task, section }: Check,
  briefOf: Map<string, string>,
): string[] {
  const reads = section.filter(([, text]) => READ_LINE.test(text));
  if (reads.length === 0) {
    return HELD.has(id) ? [] : [`${id}: its design check has no Read: line`];
  }
  const drawn = designLinks(task).filter((design) => design.link.startsWith('http'));
  return drawn.flatMap((design) => {
    const last = reads.filter(([, text]) => READ_LINE.exec(text)?.[1] === design.screen).at(-1);
    if (last === undefined)
      return [`${id}: no Read: line names ${design.screen}, which it designs`];
    return readLineProblems(repo, design, last, task.file, briefOf);
  });
}

function readLineProblems(
  repo: string,
  design: DesignLink,
  [line, text]: [number, string],
  file: string,
  briefOf: Map<string, string>,
): string[] {
  const where = `${file}:${line}`;
  const problems: string[] = [];
  const brief = briefOf.get(design.screen);
  const recorded = BRIEF.exec(text)?.[1];
  if (brief === undefined)
    problems.push(`${where}: the screens register holds no ${design.screen}`);
  else if (recorded === undefined) problems.push(`${where} names no brief digest`);
  else if (recorded !== digestOf(repo, brief)) {
    problems.push(
      `${where}: ${brief} changed since the design check (${recorded} → ${digestOf(repo, brief)}) — check the board again`,
    );
  }
  if (!RECORD.test(text)) problems.push(`${where} names no record digest`);
  const boards = new Set([...text.matchAll(BOARD)].map((m) => m[1] ?? ''));
  for (const board of [MAIN_BOARD, ...design.alsoBoards].filter((b) => !boards.has(b))) {
    problems.push(
      `${where} names no digest for the ${board} board, nor that it is over the read cap`,
    );
  }
  return problems;
}

/** Once the build has begun, every row of the ruling table carries the owner's `ruled:` decision. */
function unruled({ id, task, section }: Check): string[] {
  let inTable = false;
  return section.flatMap(([line, text]): string[] => {
    const where = `${task.file}:${line}`;
    if (FRAME_TABLE.test(text)) {
      inTable = RULING_HEADER.test(text);
      const wrongHeader = !inTable && !HELD.has(id);
      return wrongHeader
        ? [`${where}: an against-code table must read | frame | the board | the code | ruling |`]
        : [];
    }
    if (!text.startsWith('|')) inTable = false;
    const isRulingRow = inTable && task.begun && !/^\|\s*-/.test(text);
    return isRulingRow ? rulingRowProblems(id, where, text) : [];
  });
}

function rulingRowProblems(id: string, where: string, row: string): string[] {
  const cells = row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
  if (cells.length !== 4) return [`${where}: a ruling row has ${cells.length} cells, not 4`];
  if (RULED.test(cells[3] ?? '')) return [];
  return [`${where}: ${id} builds with an against-code finding the owner has not ruled`];
}

function staleHolds(checks: Check[]): string[] {
  const open = new Map(checks.map((c) => [c.id, c.section.some(([, t]) => READ_LINE.test(t))]));
  return [...HELD.keys()].flatMap((id) => {
    if (!open.has(id))
      return [`${id} is held in design-check-fresh but has no open design check — drop the hold`];
    return open.get(id) ? [`${id} now carries a Read: line — drop its hold`] : [];
  });
}

function digestOf(repo: string, file: string): string {
  return createHash('sha256')
    .update(readFileSync(join(repo, file)))
    .digest('hex')
    .slice(0, 12);
}
