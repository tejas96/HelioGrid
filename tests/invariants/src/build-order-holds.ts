import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { readScreenIndex } from './screens-register';
import { designLinks, readTaskLedger, SCREEN_ID, TASK_ID, type TaskEntry } from './task-ledger';

/**
 * The build order holds (`docs/build-order.md`): every task file sits in a block or is wholly V2,
 * every task placed apart exists and every exclusion is placed elsewhere, no open tasks wait on each
 * other in a loop or on a struck task, a V1 task waits on no V2 one, a V1 task that waits on a later
 * block is recorded and its ruling is owed before its block opens, every V1 screen task names the
 * screen it builds, and every task id is defined once, with one status line. `/task`
 * (`.claude/skills/task/SKILL.md`, *Pick*) picks the next step; this keeps what it reads true.
 */
const ORDER = 'docs/build-order.md';
const BLOCK_ROW = /^\| \*\*(\d+)\*\* \|/;
const EXCLUDED = /\(all but [^)]*\)/g;
const BACKTICKED = /`([^`]+)`/g;
const RECORDED_ROW = new RegExp(`^\\| \`(${TASK_ID})\` \\| \\d+ \\| \`(${TASK_ID})\` \\|`);
const TASK_IDS = new RegExp(TASK_ID, 'g');
const SCREEN_IDS = new RegExp(SCREEN_ID, 'g');
const OPEN = new Set(['planned', 'designed']);

interface Blocks {
  ofFile: Map<string, number>;
  ofTask: Map<string, number>;
  /** A task a row keeps out of its file's block — `(all but T-FCORE-009 …)` — must be placed elsewhere. */
  excludedFrom: Map<string, number>;
}

/** A task that waits on another, `[task, what it waits on]`. */
type Wait = [string, string];

export function findBuildOrderProblems(repo: string): string[] {
  const text = readFileSync(join(repo, ORDER), 'utf8');
  const blocks = readBlocks(text);
  const { tasks, problems: ledgerProblems } = readTaskLedger(repo);
  if (blocks.ofFile.size === 0 || tasks.size === 0) {
    throw new Error(
      'build-order-holds: no block table or no tasks read — a vacuous pass is worse than none',
    );
  }
  const v2 = new Set(
    readScreenIndex(repo)
      .filter((s) => s.cells.get('V') === 'V2')
      .map((s) => s.id),
  );
  const order = new Order(tasks, blocks, v2);
  return [
    ...ledgerProblems,
    ...order.placementProblems(),
    ...order.waitProblems(recordedWaits(text)),
    ...order.unnamedScreens(),
  ];
}

export function runBuildOrderHolds(repo: string): void {
  const problems = findBuildOrderProblems(repo);
  if (problems.length > 0) {
    throw new Error(
      `build-order-holds: ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`,
    );
  }
  console.log('build order holds — every file placed, no loop, every later-block wait recorded');
}

/** A block row's files cell: `F-core` places the file; `SHELL` → `T-SHELL-006` places one task. */
function readBlocks(text: string): Blocks {
  const blocks: Blocks = { ofFile: new Map(), ofTask: new Map(), excludedFrom: new Map() };
  for (const line of text.split('\n')) {
    const block = BLOCK_ROW.exec(line)?.[1];
    const filesCell = line.split('|')[4];
    if (block === undefined || filesCell === undefined) continue;
    for (const excluded of filesCell.match(EXCLUDED) ?? []) {
      for (const task of excluded.match(TASK_IDS) ?? [])
        blocks.excludedFrom.set(task, Number(block));
    }
    for (const entry of filesCell.replace(EXCLUDED, '').split(' · ')) {
      place(blocks, entry, Number(block));
    }
  }
  return blocks;
}

function place(blocks: Blocks, entry: string, block: number): void {
  const [file = '', placedTasks] = entry.split('→');
  if (placedTasks === undefined) {
    for (const name of fileNames(file)) blocks.ofFile.set(name, block);
    return;
  }
  for (const task of placedTasks.match(TASK_IDS) ?? []) blocks.ofTask.set(task, block);
}

/** `MS-studio-a/-b/-c` names three files. */
function fileNames(entry: string): string[] {
  const written = [...entry.matchAll(BACKTICKED)][0]?.[1];
  if (written === undefined) return [];
  const [first = '', ...suffixes] = written.split('/');
  const stem = first.slice(0, first.lastIndexOf('-'));
  return [first, ...suffixes.map((suffix) => stem + suffix)];
}

function recordedWaits(text: string): Wait[] {
  return text
    .split('\n')
    .map((line) => RECORDED_ROW.exec(line))
    .flatMap((row): Wait[] => (row?.[1] && row[2] ? [[row[1], row[2]]] : []));
}

function said([task, dep]: Wait): string {
  return `${task} → ${dep}`;
}

class Order {
  private readonly open: string[];
  private readonly v1Open: Set<string>;

  constructor(
    private readonly tasks: Map<string, TaskEntry>,
    private readonly blocks: Blocks,
    private readonly v2: Set<string>,
  ) {
    this.open = [...tasks].filter(([, t]) => OPEN.has(t.status)).map(([id]) => id);
    this.v1Open = new Set(
      this.open.filter((id) => !this.isV2(id) && this.blockOf(id) !== undefined),
    );
  }

  placementProblems(): string[] {
    const stems = new Set([...this.tasks.values()].map((t) => stemOf(t)));
    const problems = [...this.blocks.ofTask.keys()]
      .filter((id) => !this.tasks.has(id))
      .map((id) => `the block table places ${id}, which no task file holds`);
    for (const [id, block] of this.blocks.excludedFrom) {
      const placed = this.blocks.ofTask.get(id);
      if (placed === undefined || placed === block) {
        problems.push(
          `block ${block} keeps ${id} out of its file's block, but no row places it elsewhere`,
        );
      }
    }
    for (const stem of [...this.blocks.ofFile.keys()].filter((s) => !stems.has(s))) {
      problems.push(`the block table names ${stem}.md, which is not a task file`);
    }
    for (const stem of [...stems].filter((s) => !this.blocks.ofFile.has(s))) {
      const screens = [...this.tasks]
        .filter(([, t]) => stemOf(t) === stem)
        .flatMap(([id]) => this.screensOf(id));
      if (screens.length === 0)
        problems.push(`${stem}.md sits in no block and has no screen to prove it V2`);
      else if (screens.some((s) => !this.v2.has(s)))
        problems.push(`${stem}.md sits in no block but carries a V1 screen`);
    }
    return problems;
  }

  waitProblems(recorded: Wait[]): string[] {
    const later = this.waits().filter(
      ([id, dep]) => this.v1Open.has(id) && this.v1Open.has(dep) && this.isLater(dep, id),
    );
    const laterSaid = new Set(later.map(said));
    const recordedSaid = new Set(recorded.map(said));
    const current = this.currentBlock();
    return [
      ...this.loops().map((loop) => `loop: ${loop.join(' → ')}`),
      ...this.waits().flatMap(([id, dep]) => this.badWait(id, dep)),
      ...later
        .filter((wait) => !recordedSaid.has(said(wait)))
        .map(
          (wait) =>
            `${said(wait)} waits on a later block — move it, split it, or record it in ${ORDER}`,
        ),
      ...recorded
        .filter((wait) => !laterSaid.has(said(wait)))
        .map((wait) => `${ORDER} records ${said(wait)}, which is no longer a later-block wait`),
      ...recorded
        .filter((wait) => laterSaid.has(said(wait)) && this.blockOf(wait[0]) === current)
        .map(
          (wait) =>
            `block ${current} is open and ${said(wait)} still waits on a later block — its ruling is owed now`,
        ),
    ];
  }

  unnamedScreens(): string[] {
    return [...this.v1Open]
      .filter((id) => this.tasks.get(id)?.header.get('Type')?.startsWith('screen'))
      .filter((id) => this.screensNamed(id).length === 0)
      .map(
        (id) =>
          `${id} is a screen and names no screen — give it a DESIGN line, or a Design line naming its canvas`,
      );
  }

  private waits(): Wait[] {
    return this.open.flatMap((id) => this.waitsOf(id).map((dep): Wait => [id, dep]));
  }

  private badWait(id: string, dep: string): string[] {
    if (this.tasks.get(dep)?.status === 'struck') return [`${id} waits on ${dep}, which is struck`];
    if (this.v1Open.has(id) && this.open.includes(dep) && !this.v1Open.has(dep)) {
      return [`${id} is V1 and waits on ${dep}, which is not`];
    }
    return [];
  }

  /** The walk opens the lowest block that still holds an open V1 task it does not step over. */
  private currentBlock(): number | undefined {
    const blocks = [...this.v1Open]
      .filter((id) => !this.tasks.get(id)?.header.has('Parked'))
      .flatMap((id) => this.blockOf(id) ?? []);
    return blocks.length === 0 ? undefined : Math.min(...blocks);
  }

  private loops(): string[][] {
    const loops: string[][] = [];
    const state = new Map<string, 'open' | 'done'>();
    const path: string[] = [];
    const visit = (id: string): void => {
      state.set(id, 'open');
      path.push(id);
      for (const dep of this.waitsOf(id).filter((d) => this.open.includes(d))) {
        if (state.get(dep) === 'open') loops.push([...path.slice(path.indexOf(dep)), dep]);
        else if (!state.has(dep)) visit(dep);
      }
      path.pop();
      state.set(id, 'done');
    };
    for (const id of [...this.open].sort()) if (!state.has(id)) visit(id);
    return loops;
  }

  private isLater(dep: string, id: string): boolean {
    const [depBlock, idBlock] = [this.blockOf(dep), this.blockOf(id)];
    return depBlock !== undefined && idBlock !== undefined && depBlock > idBlock;
  }

  private waitsOf(id: string): string[] {
    const line = this.tasks.get(id)?.header.get('Depends on') ?? '';
    return [...new Set(line.match(TASK_IDS) ?? [])].filter((dep) => dep !== id);
  }

  private blockOf(id: string): number | undefined {
    const task = this.tasks.get(id);
    return this.blocks.ofTask.get(id) ?? (task && this.blocks.ofFile.get(stemOf(task)));
  }

  private isV2(id: string): boolean {
    const screens = this.screensOf(id);
    return screens.length > 0 && screens.every((s) => this.v2.has(s));
  }

  private screensOf(id: string): string[] {
    const task = this.tasks.get(id);
    return task === undefined ? [] : designLinks(task).map(({ screen }) => screen);
  }

  /** A screen's own DESIGN screens, or the canvas its `Design:` line names — a screen, or a task's. */
  private screensNamed(id: string): string[] {
    const design = this.tasks.get(id)?.header.get('Design') ?? '';
    const viaTasks = (design.match(TASK_IDS) ?? []).flatMap((other) => this.screensOf(other));
    return [...this.screensOf(id), ...(design.match(SCREEN_IDS) ?? []), ...viaTasks];
  }
}

function stemOf(task: TaskEntry): string {
  return basename(task.file, '.md');
}
