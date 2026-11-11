import { describe, expect, it } from 'vitest';
import type { ProjectStanding } from '../../src/projects/machine';
import {
  earlyProofOf,
  FIRST_STEP_PROOF,
  isInstallDatePassed,
  LAST_STEP_PROOF,
  missingProofOf,
  type ProofRow,
  provenStages,
  stepsProve,
} from '../../src/projects/proof';
import type { ProjectStage } from '../../src/projects/stages';

function at(stage: ProjectStage): ProjectStanding {
  return { stage, incentiveApplies: true };
}

const INSTALLED = { stage: 'installation', proof: FIRST_STEP_PROOF } as const;
const METERED = { stage: 'electrical_metering', proof: LAST_STEP_PROOF } as const;
const COMMISSIONED = { stage: 'commissioned', proof: 'commissioning_certificate' } as const;

describe('stepsProve — the first tick proves Installation, the last Electrical metering', () => {
  it.each([
    [0, 6, null],
    [-1, 6, null],
    [1, 6, INSTALLED],
    [5, 6, INSTALLED],
    [6, 6, METERED],
    [7, 6, METERED],
    [1, 1, METERED],
    [0, 0, null],
    [1, 0, null],
    [1, -1, null],
  ] as const)('%i of %i steps ticked proves %j', (ticked, total, proven) => {
    expect(stepsProve(ticked, total)).toEqual(proven);
  });
});

describe('provenStages — what the files on record prove', () => {
  it.each([
    ['done', 'commissioned', [{ stage: 'commissioned', proof: 'row' }]],
    ['pending', 'commissioned', []],
    ['not_needed', 'commissioned', []],
    ['done', null, []],
    ['done', 'cancelled', []],
    ['done', 'Commissioned', []],
  ] as const)('a %s row that moves to %j proves %j', (state, movesTo, proven) => {
    expect(provenStages([{ row: 'row', state, movesTo }], 0, 6)).toEqual(proven);
  });

  it('lists the steps’ proof first, then each document in row order', () => {
    const rows: ProofRow[] = [
      { row: 'commissioning_certificate', state: 'done', movesTo: 'commissioned' },
      { row: 'incentive_application', state: 'done', movesTo: 'incentive_claimed' },
    ];
    expect(provenStages(rows, 1, 6)).toEqual([
      INSTALLED,
      COMMISSIONED,
      { stage: 'incentive_claimed', proof: 'incentive_application' },
    ]);
  });
});

describe('earlyProofOf — the farthest proof the project has not reached', () => {
  it.each([
    ['dispatched', [], null],
    ['dispatched', [INSTALLED], INSTALLED],
    ['dispatched', [INSTALLED, METERED, COMMISSIONED], COMMISSIONED],
    ['dispatched', [COMMISSIONED, METERED, INSTALLED], COMMISSIONED],
    ['installation', [INSTALLED], null],
    ['electrical_metering', [INSTALLED, METERED], null],
    ['electrical_metering', [INSTALLED, COMMISSIONED], COMMISSIONED],
    ['incentive_claimed', [{ stage: 'handed_over', proof: 'handover_pack' }], null],
    ['handed_over', [COMMISSIONED], null],
    ['cancelled', [COMMISSIONED], null],
  ] as const)('at %s, with %j on file, asks %j', (stage, proven, early) => {
    expect(earlyProofOf(at(stage), proven)).toEqual(early);
  });

  it('keeps the first of two proofs of the same stage', () => {
    const second = { stage: 'commissioned', proof: 'second_certificate' } as const;
    expect(earlyProofOf(at('dispatched'), [COMMISSIONED, second])).toEqual(COMMISSIONED);
  });
});

describe('missingProofOf — a stage reached while the row proving it still waits', () => {
  const pending = (movesTo: string | null): ProofRow => ({
    row: 'commissioning_certificate',
    state: 'pending',
    movesTo,
  });

  it.each([
    ['utility_inspection', pending('commissioned'), null],
    ['commissioned', pending('commissioned'), 'commissioning_certificate'],
    ['incentive_claimed', pending('commissioned'), 'commissioning_certificate'],
    ['commissioned', { ...pending('commissioned'), state: 'done' }, null],
    ['commissioned', { ...pending('commissioned'), state: 'not_needed' }, null],
    ['commissioned', pending(null), null],
    ['commissioned', pending('not_a_stage'), null],
    ['cancelled', pending('commissioned'), null],
  ] as const)('at %s, %j is missing %j', (stage, row, missing) => {
    expect(missingProofOf(at(stage), [row])).toBe(missing);
  });

  it('names the first row missing, and nothing with no rows', () => {
    const rows: ProofRow[] = [
      { row: 'utility_approval', state: 'done', movesTo: 'commissioned' },
      { row: 'commissioning_certificate', state: 'pending', movesTo: 'commissioned' },
      { row: 'incentive_application', state: 'pending', movesTo: 'commissioned' },
    ];
    expect(missingProofOf(at('commissioned'), rows)).toBe('commissioning_certificate');
    expect(missingProofOf(at('commissioned'), [])).toBeNull();
  });
});

describe('isInstallDatePassed — the promised day is behind today and the crew has not started (M07-62)', () => {
  const TODAY = '2026-11-10';

  it.each([
    ['dispatched', '2026-11-09', true],
    ['won', '2026-11-09', true],
    ['dispatched', '2026-11-10', false],
    ['dispatched', '2026-11-11', false],
    ['installation', '2026-11-09', false],
    ['electrical_metering', '2026-11-09', false],
    ['dispatched', null, false],
    ['handed_over', '2026-11-09', false],
    ['cancelled', '2026-11-09', false],
  ] as const)('at %s, an install promised on %s has passed: %s', (stage, expectedOn, passed) => {
    expect(isInstallDatePassed(at(stage), expectedOn, TODAY)).toBe(passed);
  });
});
