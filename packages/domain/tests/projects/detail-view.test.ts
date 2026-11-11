import { describe, expect, it } from 'vitest';
import { type DetailFacts, projectDetailViewOf } from '../../src/projects/detail-view';

/**
 * The journey as the picked design draws it (2026-11-11): a stage a proof moved the project over is
 * *passed*, never a done check; a stage the deal does not walk is *skipped*; each stage carries the
 * day it began.
 */

const move = (from: string | null, to: string, enteredOn: string, cause = 'person') => ({
  from,
  to,
  cause,
  proof: null,
  movedAt: `${enteredOn}T10:00:00.000Z`,
  enteredOn,
  movedBy: cause === 'person' ? { userId: 'u1', name: 'Priya' } : null,
});

const facts = (typed: Partial<DetailFacts>): DetailFacts => ({
  stage: 'won',
  enteredOn: '2026-11-01',
  today: '2026-11-11',
  incentiveApplies: true,
  todo: null,
  earlyProofTo: null,
  missingProofRow: null,
  journey: [move(null, 'won', '2026-11-01')],
  documents: [],
  steps: [],
  ...typed,
});

const stateOf = (view: ReturnType<typeof projectDetailViewOf>, stage: string) =>
  view.journey.find((row) => row.stage === stage);

describe('projectDetailViewOf — the journey', () => {
  it('a stage an early proof moved over reads passed, with no day and no mover', () => {
    const view = projectDetailViewOf(
      facts({
        stage: 'commissioned',
        enteredOn: '2026-11-10',
        journey: [
          move(null, 'won', '2026-11-01'),
          move('won', 'material_ordered', '2026-11-02'),
          move('material_ordered', 'dispatched', '2026-11-03'),
          move('dispatched', 'installation', '2026-11-04', 'proof'),
          move('installation', 'electrical_metering', '2026-11-05', 'proof'),
          move('electrical_metering', 'commissioned', '2026-11-10', 'proof'),
        ],
      }),
    );
    expect(stateOf(view, 'utility_inspection')).toMatchObject({
      state: 'passed',
      on: null,
      by: null,
    });
    expect(stateOf(view, 'electrical_metering')).toMatchObject({ state: 'done', on: '2026-11-05' });
    expect(stateOf(view, 'commissioned')).toMatchObject({ state: 'now', on: '2026-11-10' });
  });

  it('a stage the deal does not walk reads skipped', () => {
    const view = projectDetailViewOf(facts({ incentiveApplies: false }));
    expect(stateOf(view, 'incentive_claimed')?.state).toBe('skipped');
  });

  it('the day a stage began is the one the person gave, not the day it was recorded', () => {
    const dispatched = {
      ...move('material_ordered', 'dispatched', '2026-11-08'),
      movedAt: '2026-11-11T09:00:00.000Z',
    };
    const view = projectDetailViewOf(
      facts({
        stage: 'dispatched',
        enteredOn: '2026-11-08',
        journey: [
          move(null, 'won', '2026-11-01'),
          move('won', 'material_ordered', '2026-11-05'),
          dispatched,
        ],
      }),
    );
    expect(stateOf(view, 'dispatched')).toMatchObject({ state: 'now', on: '2026-11-08' });
    expect(view.days).toBe(3);
  });
});

describe('projectDetailViewOf — a cancelled project, and when handover opens', () => {
  const cancelled = facts({
    stage: 'cancelled',
    enteredOn: '2026-11-04',
    journey: [
      move(null, 'won', '2026-11-01'),
      move('won', 'material_ordered', '2026-11-02'),
      move('material_ordered', 'cancelled', '2026-11-04'),
    ],
  });

  it.each([
    ['material_ordered', 'done'],
    ['dispatched', 'not_reached'],
    ['handed_over', 'not_reached'],
  ])('a cancelled project reads %s as %s — never a stage still ahead', (stage, state) => {
    expect(stateOf(projectDetailViewOf(cancelled), stage)?.state).toBe(state);
  });

  it('a live project still reads the stages after its own as next', () => {
    expect(stateOf(projectDetailViewOf(facts({})), 'material_ordered')?.state).toBe('next');
  });

  it.each([
    ['incentive_claimed', true, { kind: 'open' }],
    ['commissioned', false, { kind: 'open' }],
    ['commissioned', true, { kind: 'not_yet', from: 'incentive_claimed' }],
    ['won', false, { kind: 'not_yet', from: 'commissioned' }],
    ['handed_over', true, { kind: 'closed' }],
    ['cancelled', true, { kind: 'closed' }],
  ] as const)('at %s (subsidy %s) handover reads %j', (stage, incentiveApplies, handover) => {
    const journey = stage === 'cancelled' ? cancelled.journey : [move(null, stage, '2026-11-01')];
    expect(projectDetailViewOf(facts({ stage, incentiveApplies, journey })).handover).toEqual(
      handover,
    );
  });
});
