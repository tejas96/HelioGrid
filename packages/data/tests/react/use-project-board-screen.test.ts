// @vitest-environment happy-dom
import type { TodoRow } from '@heliogrid/domain';
import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProjectBoardScreen } from '../../src/react/use-project-board-screen';
import { useTenantId } from '../../src/react/use-tenant-id';
import { aBoard, aCard } from './projects-fixtures';
import {
  mountedOver,
  NO_PROJECTS_ROLE,
  origin,
  READS_PROJECTS_ROLE,
  readsOf,
  settle,
} from './projects-origin';

/**
 * The board (`SCR-M08-01`) through the real client: the one read becomes domain's view — the acts
 * only a person can do, the waits by party with the company's own first, the stages oldest first —
 * and an early proof is confirmed from its row in one tap.
 */

/* Listed out of every order the view sorts by, so each order is the view's own. */
const CUSTOMER_WAIT = aCard(3, 'won', '2026-11-08', {
  wait: { party: 'customer', reason: 'customer_documents', startedOn: '2026-11-05' },
});
const EARLY = aCard(1, 'installation', '2026-11-01', {
  todo: 'proof_early',
  earlyProofTo: 'electrical_metering',
});
const COMPANY_WAIT = aCard(4, 'won', '2026-11-02', {
  wait: { party: 'company', reason: 'crew_availability', startedOn: '2026-11-07' },
});
const DATE_PASSED = aCard(2, 'dispatched', '2026-10-28', { todo: 'install_date_passed' });
const LIVE = [CUSTOMER_WAIT, EARLY, COMPANY_WAIT, DATE_PASSED];

async function mountedBoard() {
  const view = mountedOver(() => useProjectBoardScreen());
  await waitFor(() => expect(view.result.current.read.kind).not.toBe('loading'));
  return view;
}

type BoardView = Awaited<ReturnType<typeof mountedBoard>>;
function shown(view: BoardView) {
  const { read } = view.result.current;
  if (read.kind !== 'ready') throw new Error(`the board is ${read.kind}`);
  return read.value;
}
const idsOf = (rows: readonly { card: { id: string } }[]) => rows.map((row) => row.card.id);

describe('Project board — the read as domain’s view', () => {
  it('to-dos by kind, waits by party company first, stages oldest first', async () => {
    origin.board = aBoard(LIVE);
    const board = shown(await mountedBoard());
    expect(board.todo.map((row) => [row.card.id, row.kind])).toEqual([
      [EARLY.id, 'proof_early'],
      [DATE_PASSED.id, 'install_date_passed'],
    ]);
    expect(board.waits.map((group) => [group.party, idsOf(group.rows)])).toEqual([
      ['company', [COMPANY_WAIT.id]],
      ['customer', [CUSTOMER_WAIT.id]],
    ]);
    expect(board.waits.flatMap((group) => group.rows.map((row) => row.waitDays))).toEqual([3, 5]);
    expect(board.groups.map((group) => [group.stage, idsOf(group.rows)])).toEqual([
      ['won', [COMPANY_WAIT.id, CUSTOMER_WAIT.id]],
      ['dispatched', [DATE_PASSED.id]],
      ['installation', [EARLY.id]],
    ]);
    expect(board.groups[0]?.longestDays).toBe(8);
    expect(board.allClear).toBe(false);
  });

  it.each([
    ['nothing anywhere', aBoard([]), 'empty'],
    ['one project in one stage', aBoard([CUSTOMER_WAIT]), 'ready'],
  ] as const)('%s reads %s', async (_, board, kind) => {
    origin.board = board;
    const view = await mountedBoard();
    expect(view.result.current.read.kind).toBe(kind);
  });

  it.each([
    ['a stage with projects', 'won', [['won', [COMPANY_WAIT.id, CUSTOMER_WAIT.id]]]],
    ['a stage with none', 'commissioned', [['commissioned', []]]],
    [
      'every stage again',
      null,
      [
        ['won', [COMPANY_WAIT.id, CUSTOMER_WAIT.id]],
        ['dispatched', [DATE_PASSED.id]],
        ['installation', [EARLY.id]],
      ],
    ],
  ] as const)('choosing %s narrows the groups to it', async (_, stage, groups) => {
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    act(() => view.result.current.choose('dispatched'));
    act(() => view.result.current.choose(stage));
    const board = shown(view);
    expect(board.groups.map((group) => [group.stage, idsOf(group.rows)])).toEqual(groups);
    expect(board.stops.filter((stop) => stop.chosen).map((stop) => stop.stage)).toEqual(
      stage === null ? [] : [stage],
    );
  });
});

describe('Project board — the search and the handed-over stop', () => {
  it('a search narrows the lists to what it finds; the hero still counts the whole board', async () => {
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    act(() => view.result.current.search('prj-0042'));
    const found = shown(view);
    expect(view.result.current.searched).toBe('prj-0042');
    expect(found.searched).toBe('prj-0042');
    expect(found.todo.map((row) => row.card.id)).toEqual([DATE_PASSED.id]);
    expect(found.waits).toEqual([]);
    expect(found.groups.map((group) => [group.stage, idsOf(group.rows)])).toEqual([
      ['dispatched', [DATE_PASSED.id]],
    ]);
    expect([found.todoCount, found.waitCount]).toEqual([2, 2]);
  });

  it('a search that finds nothing empties every list, and a blank one shows all again', async () => {
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    act(() => view.result.current.search('Pune'));
    const missed = shown(view);
    expect([missed.todo, missed.waits, missed.groups]).toEqual([[], [], []]);
    expect(missed.allClear).toBe(false);
    act(() => view.result.current.search(''));
    expect(shown(view).groups.flatMap((group) => idsOf(group.rows))).toHaveLength(LIVE.length);
  });

  it('only the handed-over stop counts back 30 days, and only choosing it reads its projects', async () => {
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    expect(
      shown(view)
        .stops.filter((stop) => stop.recent)
        .map((stop) => stop.stage),
    ).toEqual(['handed_over']);
    act(() => view.result.current.choose('won'));
    await settle();
    expect(readsOf('/projects/closed')).toBe(0);
    act(() => view.result.current.choose('handed_over'));
    await waitFor(() => expect(readsOf('/projects/closed')).toBeGreaterThan(0));
    expect(shown(view).groups.map((group) => group.stage)).toEqual(['handed_over']);
  });
});

describe('Project board — a to-do row’s act', () => {
  it('an early proof opens its project with the early-proof sheet to ask, and sends nothing', async () => {
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    const row = shown(view).todo[0] as TodoRow;
    expect(row.kind).toBe('proof_early');
    expect(view.result.current.todo(row)).toEqual({ projectId: EARLY.id, ask: 'earlyProof' });
    await settle();
    expect(origin.writes).toHaveLength(0);
  });

  it.each([
    ['a passed install date', { card: DATE_PASSED, days: 13, kind: 'install_date_passed' }],
    ['a missing proof', { card: DATE_PASSED, days: 13, kind: 'proof_missing' }],
    [
      'an early proof with no stage to go to',
      { card: { ...EARLY, earlyProofTo: null }, days: 9, kind: 'proof_early' },
    ],
  ] as const)('%s opens the project with nothing to ask, and sends nothing', async (_, row) => {
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    expect(view.result.current.todo(row as TodoRow)).toEqual({ projectId: row.card.id, ask: null });
    await settle();
    expect(origin.writes).toHaveLength(0);
  });

  it('a reader who may move nothing has nothing to do here: no To do, the rest the same (M08-18)', async () => {
    origin.roles = [READS_PROJECTS_ROLE];
    origin.board = aBoard(LIVE);
    const view = await mountedBoard();
    expect(shown(view).todo).toEqual([]);
    expect(shown(view).waits.length).toBeGreaterThan(0);
  });
});

describe('Project board — the door (F7-48)', () => {
  it('a person whose presets do not open it is not allowed, and nothing is read', async () => {
    origin.roles = [NO_PROJECTS_ROLE];
    const view = mountedOver(() => ({ screen: useProjectBoardScreen(), tenantId: useTenantId() }));
    await waitFor(() => expect(view.result.current.tenantId).not.toBe(''));
    await settle();
    expect(view.result.current.screen.allowed).toBe(false);
    expect(readsOf('/projects/board')).toBe(0);
  });
});
