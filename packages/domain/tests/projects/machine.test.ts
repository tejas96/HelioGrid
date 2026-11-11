import { describe, expect, it } from 'vitest';
import {
  decideEarlyMove,
  decideHandover,
  decideMoveBack,
  decidePersonMove,
  decideProof,
  decideUndo,
  type LastMove,
  nextStageOf,
  type ProjectMoveResult,
  type ProjectStanding,
  previousStageOf,
  UNDO_WINDOW_MS,
} from '../../src/projects/machine';
import { FIRST_STEP_PROOF, LAST_STEP_PROOF } from '../../src/projects/proof';
import type { ProjectStage } from '../../src/projects/stages';

/** A project standing at `stage`, its deal claiming an incentive unless told otherwise. */
function at(stage: ProjectStage, incentiveApplies = true): ProjectStanding {
  return { stage, incentiveApplies };
}

/** The refusal of an act that must have been refused, or `null` when it moved. */
function refusalOf(result: ProjectMoveResult): string | null {
  return result.kind === 'refused' ? result.refusal : null;
}

describe('nextStageOf / previousStageOf — the deal’s own chain (M08-08, M08-09)', () => {
  it.each([
    ['won', true, 'material_ordered'],
    ['commissioned', true, 'incentive_claimed'],
    ['commissioned', false, 'handed_over'],
    ['incentive_claimed', true, 'handed_over'],
    ['incentive_claimed', false, null],
    ['handed_over', true, null],
    ['cancelled', true, null],
  ] as const)('after %s (incentive %s) comes %s', (stage, incentiveApplies, next) => {
    expect(nextStageOf(at(stage, incentiveApplies))).toBe(next);
  });

  it.each([
    ['won', true, null],
    ['material_ordered', true, 'won'],
    ['handed_over', true, 'incentive_claimed'],
    ['handed_over', false, 'commissioned'],
    ['incentive_claimed', false, null],
    ['cancelled', true, null],
  ] as const)('before %s (incentive %s) comes %s', (stage, incentiveApplies, previous) => {
    expect(previousStageOf(at(stage, incentiveApplies))).toBe(previous);
  });
});

describe('decidePersonMove — a tap moves to the next stage only (M08-14)', () => {
  it.each([
    ['handed_over', true, 'commissioned', 'project_closed'],
    ['cancelled', true, 'material_ordered', 'project_closed'],
    ['incentive_claimed', true, 'handed_over', 'needs_handover'],
    ['commissioned', false, 'handed_over', 'needs_handover'],
    ['won', true, 'cancelled', 'not_next_stage'],
    ['material_ordered', true, 'dispatched', 'needs_crew'],
    ['won', true, 'dispatched', 'needs_crew'],
    ['dispatched', true, 'material_ordered', 'already_moved'],
    ['dispatched', true, 'won', 'already_moved'],
    ['won', true, 'installation', 'not_next_stage'],
    ['commissioned', false, 'incentive_claimed', 'not_next_stage'],
    ['won', true, 'material_ordered', null],
    ['commissioned', true, 'incentive_claimed', null],
  ] as const)(
    'at %s (incentive %s), a tap to %s is refused for %s',
    (stage, incentive, to, refusal) => {
      expect(refusalOf(decidePersonMove(at(stage, incentive), to))).toBe(refusal);
    },
  );

  it('records a person’s move with no proof and nothing passed', () => {
    expect(decidePersonMove(at('won'), 'material_ordered')).toEqual({
      kind: 'moved',
      move: {
        from: 'won',
        to: 'material_ordered',
        cause: 'person',
        proof: null,
        passed: [],
      },
    });
  });
});

describe('decideMoveBack — one stage back, never past Won (M08-14)', () => {
  it.each([
    ['won', true, 'nothing_behind'],
    ['incentive_claimed', false, 'nothing_behind'],
    ['handed_over', true, 'project_closed'],
    ['cancelled', true, 'project_closed'],
    ['material_ordered', true, null],
  ] as const)('at %s (incentive %s) a move back is refused for %s', (stage, incentive, refusal) => {
    expect(refusalOf(decideMoveBack(at(stage, incentive), stage))).toBe(refusal);
  });

  it('a second person’s move back from the stage the first already left is already moved (ruling 16)', () => {
    expect(refusalOf(decideMoveBack(at('dispatched'), 'installation'))).toBe('already_moved');
  });

  it('moves one stage back as a person’s move', () => {
    expect(decideMoveBack(at('installation'), 'installation')).toEqual({
      kind: 'moved',
      move: { from: 'installation', to: 'dispatched', cause: 'person', proof: null, passed: [] },
    });
  });
});

describe('decideProof — proof moves the next stage, asks one tap further on (M08-15)', () => {
  it.each([
    ['material_ordered', true, 'installation', 'early'],
    ['won', true, 'electrical_metering', 'early'],
    ['commissioned', false, 'incentive_claimed', 'none'],
    ['installation', true, 'installation', 'none'],
    ['electrical_metering', true, 'installation', 'none'],
    ['incentive_claimed', true, 'handed_over', 'none'],
    ['handed_over', true, 'commissioned', 'none'],
    ['cancelled', true, 'installation', 'none'],
    ['dispatched', true, 'installation', 'moved'],
  ] as const)('at %s (incentive %s), proof of %s is %s', (stage, incentive, target, kind) => {
    expect(decideProof(at(stage, incentive), target, FIRST_STEP_PROOF).kind).toBe(kind);
  });

  it('moves as proof and keeps the proof that did it', () => {
    expect(
      decideProof(at('electrical_metering'), 'utility_inspection', 'utility_approval'),
    ).toEqual({
      kind: 'moved',
      move: {
        from: 'electrical_metering',
        to: 'utility_inspection',
        cause: 'proof',
        proof: 'utility_approval',
        passed: [],
      },
    });
  });
});

describe('decideEarlyMove — the one tap an early proof asks (ruling 2026-11-10)', () => {
  it.each([
    ['handed_over', 'commissioned', 'project_closed'],
    ['cancelled', 'installation', 'project_closed'],
    ['incentive_claimed', 'handed_over', 'needs_handover'],
    ['installation', 'installation', 'already_moved'],
    ['electrical_metering', 'installation', 'already_moved'],
    ['dispatched', 'installation', null],
    ['won', 'electrical_metering', null],
  ] as const)('at %s, an early move to %s is refused for %s', (stage, target, refusal) => {
    expect(refusalOf(decideEarlyMove(at(stage), target, LAST_STEP_PROOF))).toBe(refusal);
  });

  it.each([
    ['dispatched', 'installation', []],
    ['won', 'electrical_metering', ['material_ordered', 'dispatched', 'installation']],
  ] as const)('from %s to %s it passes %j', (stage, target, passed) => {
    expect(decideEarlyMove(at(stage), target, LAST_STEP_PROOF)).toEqual({
      kind: 'moved',
      move: { from: stage, to: target, cause: 'proof', proof: LAST_STEP_PROOF, passed },
    });
  });
});

describe('decideHandover — from the stage before it, with no row waiting (M08-32, M08-46)', () => {
  it.each([
    ['handed_over', true, [], 'project_closed'],
    ['cancelled', true, [], 'project_closed'],
    ['utility_inspection', true, [], 'not_next_stage'],
    ['commissioned', true, [], 'not_next_stage'],
    ['incentive_claimed', true, ['warranty_documents'], 'documents_pending'],
    ['commissioned', false, ['warranty_documents'], 'documents_pending'],
    ['incentive_claimed', true, [], null],
    ['commissioned', false, [], null],
  ] as const)(
    'at %s (incentive %s) with %j pending, handover is refused for %s',
    (stage, incentive, pending, refusal) => {
      expect(refusalOf(decideHandover(at(stage, incentive), pending))).toBe(refusal);
    },
  );

  it.each([
    ['incentive_claimed', true, []],
    ['commissioned', false, []],
  ] as const)('from %s (incentive %s) it hands over, passing %j', (stage, incentive, passed) => {
    expect(decideHandover(at(stage, incentive), [])).toEqual({
      kind: 'moved',
      move: { from: stage, to: 'handed_over', cause: 'handover', proof: null, passed },
    });
  });
});

describe('decideUndo — a person’s own last move, while its toast shows (ruling 2026-11-10)', () => {
  const MOVED_AT = Date.parse('2026-11-10T04:00:00Z');
  const PRIYAS_TAP: LastMove = {
    from: 'dispatched',
    to: 'installation',
    cause: 'person',
    by: 'priya',
    at: MOVED_AT,
  };

  it.each([
    ['no move on record', null, 'installation', 'priya', 0, 'not_undoable'],
    [
      'a proof’s move',
      { ...PRIYAS_TAP, cause: 'proof' },
      'installation',
      'priya',
      0,
      'not_undoable',
    ],
    [
      'a handover',
      { ...PRIYAS_TAP, cause: 'handover' },
      'installation',
      'priya',
      0,
      'not_undoable',
    ],
    ['a cancel', { ...PRIYAS_TAP, cause: 'cancel' }, 'installation', 'priya', 0, 'not_undoable'],
    ['an undo', { ...PRIYAS_TAP, cause: 'undo' }, 'installation', 'priya', 0, 'not_undoable'],
    ['another person’s move', PRIYAS_TAP, 'installation', 'rajesh', 0, 'not_undoable'],
    ['a move by nobody', { ...PRIYAS_TAP, by: null }, 'installation', 'priya', 0, 'not_undoable'],
    ['a move something moved past', PRIYAS_TAP, 'electrical_metering', 'priya', 0, 'not_undoable'],
    [
      'a move 1 ms past the window',
      PRIYAS_TAP,
      'installation',
      'priya',
      UNDO_WINDOW_MS + 1,
      'not_undoable',
    ],
    ['a move exactly at the window', PRIYAS_TAP, 'installation', 'priya', UNDO_WINDOW_MS, null],
    [
      'a move 1 ms inside the window',
      PRIYAS_TAP,
      'installation',
      'priya',
      UNDO_WINDOW_MS - 1,
      null,
    ],
    ['a move this instant', PRIYAS_TAP, 'installation', 'priya', 0, null],
  ] as const)('undoing %s is refused for %s', (_name, last, stage, actor, elapsed, refusal) => {
    expect(refusalOf(decideUndo(at(stage), last, actor, MOVED_AT + elapsed))).toBe(refusal);
  });

  it('moves back to where the undone move started, as an undo', () => {
    expect(decideUndo(at('installation'), PRIYAS_TAP, 'priya', MOVED_AT)).toEqual({
      kind: 'moved',
      move: { from: 'installation', to: 'dispatched', cause: 'undo', proof: null, passed: [] },
    });
  });
});
