import { describe, expect, it } from 'vitest';
import {
  decideCancel,
  decideDispatch,
  isPromisableInstallDate,
  type ProjectMoveResult,
  type ProjectStanding,
} from '../../src/projects/machine';
import type { ProjectStage } from '../../src/projects/stages';

/**
 * The machine's days and reasons (the picked design, 2026-11-11): Dispatched takes the day the
 * material left, a promised install date is today or later, and a cancel names its reason.
 */

/** A project standing at `stage`, its deal claiming an incentive. */
function at(stage: ProjectStage): ProjectStanding {
  return { stage, incentiveApplies: true };
}

/** The refusal of an act that must have been refused, or `null` when it moved. */
function refusalOf(result: ProjectMoveResult): string | null {
  return result.kind === 'refused' ? result.refusal : null;
}

const SAME_DAY = { leftOn: '2026-11-11', enteredOn: '2026-11-11', today: '2026-11-11' } as const;

describe('decideDispatch — Dispatched names its crew, the one way there (ruling 6)', () => {
  it.each([
    ['material_ordered', null],
    ['won', 'not_next_stage'],
    ['dispatched', 'already_moved'],
    ['installation', 'already_moved'],
    ['cancelled', 'project_closed'],
  ] as const)('from %s: %s', (stage, refusal) => {
    expect(refusalOf(decideDispatch(at(stage), SAME_DAY))).toBe(refusal);
  });

  it.each([
    ['2026-11-12', 'date_in_future'],
    ['2026-11-07', 'date_before_stage'],
    ['2026-11-08', null],
    ['2026-11-11', null],
  ] as const)('material that left on %s: %s', (leftOn, refusal) => {
    const day = { leftOn, enteredOn: '2026-11-08', today: '2026-11-11' } as const;
    expect(refusalOf(decideDispatch(at('material_ordered'), day))).toBe(refusal);
  });
});

const BACKED_OUT = { reason: 'customer_backed_out', note: null } as const;

describe('isPromisableInstallDate — a promised date is today or later', () => {
  it.each([
    ['2026-11-10', false],
    ['2026-11-11', true],
    ['2026-12-01', true],
  ] as const)('%s promised on 2026-11-11: %s', (on, taken) => {
    expect(isPromisableInstallDate(on, '2026-11-11')).toBe(taken);
  });
});

describe('decideCancel — from any stage but the two ends (M08-51)', () => {
  it.each([
    ['won', null],
    ['incentive_claimed', null],
    ['handed_over', 'project_closed'],
    ['cancelled', 'project_closed'],
  ] as const)('at %s a cancel is refused for %s', (stage, refusal) => {
    expect(refusalOf(decideCancel(at(stage), BACKED_OUT))).toBe(refusal);
  });

  it("something else needs the person's words; a named reason needs none", () => {
    const blank = { reason: 'something_else', note: '  ' } as const;
    expect(refusalOf(decideCancel(at('won'), blank))).toBe('reason_needed');
    const said = { reason: 'something_else', note: 'Roof sold' } as const;
    expect(refusalOf(decideCancel(at('won'), said))).toBeNull();
  });

  it('moves to cancelled as a cancel, passing nothing', () => {
    expect(decideCancel(at('installation'), BACKED_OUT)).toEqual({
      kind: 'moved',
      move: { from: 'installation', to: 'cancelled', cause: 'cancel', proof: null, passed: [] },
    });
  });
});
