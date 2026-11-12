import { describe, expect, it } from 'vitest';
import {
  type BoardCard,
  type BoardChoice,
  type BoardFacts,
  handedOverSince,
  projectBoardViewOf,
} from '../../src/projects/board-view';

/**
 * The board as the picked design draws it (2026-11-11): a search that narrows the lists but never
 * the hero, and a handed-over stop that counts the last 30 days and lists those projects.
 */

const TODAY = '2026-11-11';

const card = (id: string, typed: Partial<BoardCard> = {}): BoardCard => ({
  id,
  number: `PRJ-${id}`,
  name: `Project ${id}`,
  place: 'Pune',
  stage: 'won',
  enteredOn: '2026-11-08',
  manager: { userId: 'm1', name: 'Priya' },
  expectedInstallOn: null,
  steps: { ticked: 0, total: 6 },
  wait: null,
  todo: null,
  earlyProofTo: null,
  missingProofRow: null,
  ...typed,
});

const facts = (live: readonly BoardCard[]): BoardFacts => ({
  today: TODAY,
  stages: [
    { stage: 'won', count: live.length, oldestEnteredOn: '2026-11-08' },
    { stage: 'handed_over', count: 2, oldestEnteredOn: '2026-10-20' },
  ],
  live,
});

const all: BoardChoice = {
  stage: null,
  searched: '',
  canAct: true,
  handedOver: null,
  sort: 'longest',
  manager: null,
};

describe('projectBoardViewOf — search', () => {
  const board = facts([
    card('0001', { name: 'Sharma Residence', place: 'Kothrud' }),
    card('0002', { name: 'Joshi Clinic', place: 'Aundh', todo: 'install_date_passed' }),
    card('0003', {
      name: null,
      place: 'Satara',
      wait: { party: 'utility', reason: 'utility_approval', startedOn: '2026-11-09' },
    }),
  ]);

  it.each([
    ['sharma', ['0001']],
    ['AUNDH', ['0002']],
    ['prj-0003', ['0003']],
    ['  ', ['0001', '0002', '0003']],
    ['nobody', []],
  ] as const)('“%s” finds %j', (searched, ids) => {
    const view = projectBoardViewOf(board, { ...all, searched });
    expect(view.groups.flatMap((group) => group.rows.map((row) => row.card.id))).toEqual(ids);
    expect(view.searched).toBe(searched);
  });

  it('narrows To do and Waiting, while the hero still counts the whole board', () => {
    const view = projectBoardViewOf(board, { ...all, searched: 'sharma' });
    expect(view.todo).toEqual([]);
    expect(view.waits).toEqual([]);
    expect([view.todoCount, view.waitCount, view.allClear]).toEqual([1, 1, false]);
  });
});

describe('projectBoardViewOf — the handed-over stop', () => {
  const handed = card('0009', { stage: 'handed_over', enteredOn: '2026-11-01' });

  it('says it counts the last 30 days; every other stop counts a stay', () => {
    const view = projectBoardViewOf(facts([card('0001')]), all);
    const recent = view.stops.filter((stop) => stop.recent).map((stop) => stop.stage);
    expect(recent).toEqual(['handed_over']);
  });

  it('lists the handed-over projects it is given when chosen, and none of the live ones', () => {
    const chosen: BoardChoice = { ...all, stage: 'handed_over', handedOver: [handed] };
    const view = projectBoardViewOf(facts([card('0001')]), chosen);
    expect(view.groups).toEqual([
      { stage: 'handed_over', rows: [{ card: handed, days: 10 }], longestDays: 10 },
    ]);
  });

  it('while the handed-over list is still out, the stage shows empty, never the live projects', () => {
    const view = projectBoardViewOf(facts([card('0001')]), { ...all, stage: 'handed_over' });
    expect(view.groups).toEqual([{ stage: 'handed_over', rows: [], longestDays: null }]);
  });
});

describe('handedOverSince — the stop looks back 30 company days', () => {
  it.each([
    ['2026-11-11', '2026-10-12'],
    ['2026-03-01', '2026-01-30'],
    ['2026-01-15', '2025-12-16'],
  ] as const)('from %s: %s', (today, since) => {
    expect(handedOverSince(today)).toBe(since);
  });
});

describe('projectBoardViewOf — the order and one manager', () => {
  const board = facts([
    card('0001', { enteredOn: '2026-11-01', expectedInstallOn: '2026-11-20' }),
    card('0002', { enteredOn: '2026-11-10', expectedInstallOn: null }),
    card('0003', {
      enteredOn: '2026-11-05',
      expectedInstallOn: '2026-11-15',
      manager: { userId: 'm2', name: 'Arjun' },
    }),
    card('0004', { enteredOn: '2026-11-05', expectedInstallOn: '2026-11-15' }),
  ]);
  const ids = (view: ReturnType<typeof projectBoardViewOf>) =>
    view.groups.flatMap((group) => group.rows.map((row) => row.card.id));

  it.each([
    ['longest', ['0001', '0003', '0004', '0002']],
    ['install', ['0003', '0004', '0001', '0002']],
  ] as const)('orders %s first, a tie by id', (sort, order) => {
    expect(ids(projectBoardViewOf(board, { ...all, sort }))).toEqual(order);
  });

  it('keeps the stage’s longest days whatever the order', () => {
    const view = projectBoardViewOf(board, { ...all, sort: 'install' });
    expect(view.groups[0]?.longestDays).toBe(10);
  });

  it.each([
    [null, ['0001', '0003', '0004', '0002']],
    ['m2', ['0003']],
    ['nobody', []],
  ] as const)('shows manager %s’s projects', (manager, shown) => {
    expect(ids(projectBoardViewOf(board, { ...all, manager }))).toEqual(shown);
  });

  it('names every manager A to Z with their count, and the hero counts the whole board', () => {
    const view = projectBoardViewOf(board, { ...all, manager: 'm2' });
    expect(view.managers).toEqual([
      { userId: 'm2', name: 'Arjun', count: 1 },
      { userId: 'm1', name: 'Priya', count: 3 },
    ]);
    expect(view.liveCount).toBe(4);
  });
});
