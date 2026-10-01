import { describe, expect, it } from 'vitest';
import { FIRST_RUN_COACH_MARKS, firstRunMarksFor, marksToShow } from '../../src/shell/coach-marks';

describe('firstRunMarksFor — a mark only for a control on screen (M01-16)', () => {
  it.each([
    { homes: 1, centreVerb: null, marks: [] },
    { homes: 1, centreVerb: 'add_lead', marks: ['centre-action'] },
    { homes: 2, centreVerb: null, marks: ['switch-home'] },
    { homes: 2, centreVerb: 'start_survey', marks: ['switch-home', 'centre-action'] },
    { homes: 0, centreVerb: null, marks: [] },
  ] as const)(
    'lists only the marks whose control is on screen: homes $homes, verb $centreVerb → $marks',
    ({ homes, centreVerb, marks }) => {
      expect(firstRunMarksFor({ homes, centreVerb })).toEqual(marks);
    },
  );

  it('never shows more marks than the first-run cap', () => {
    const widest = firstRunMarksFor({ homes: 12, centreVerb: 'add_lead' });
    expect(widest.length).toBeLessThanOrEqual(FIRST_RUN_COACH_MARKS);
  });
});

describe('marksToShow — the marks after the passed count (M01-16)', () => {
  it.each([
    { marks: ['switch-home', 'centre-action'], passed: null, toShow: [] },
    {
      marks: ['switch-home', 'centre-action'],
      passed: 0,
      toShow: ['switch-home', 'centre-action'],
    },
    { marks: ['switch-home', 'centre-action'], passed: 1, toShow: ['centre-action'] },
    { marks: ['switch-home', 'centre-action'], passed: 2, toShow: [] },
    { marks: ['switch-home', 'centre-action'], passed: 3, toShow: [] },
    { marks: [], passed: 0, toShow: [] },
  ] as const)('passed $passed of $marks → $toShow', ({ marks, passed, toShow }) => {
    expect(marksToShow(marks, passed)).toEqual(toShow);
  });

  it('indexes the passed count into the list as it stands', () => {
    const passedAlone = 1;
    expect(
      marksToShow(firstRunMarksFor({ homes: 1, centreVerb: 'add_lead' }), passedAlone),
    ).toEqual([]);
    expect(
      marksToShow(firstRunMarksFor({ homes: 2, centreVerb: 'add_lead' }), passedAlone),
    ).toEqual(['centre-action']);
  });
});
