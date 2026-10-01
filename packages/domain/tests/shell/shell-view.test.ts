import { describe, expect, it } from 'vitest';
import { shellViewFor } from '../../src/shell/shell-view';

describe('shellViewFor — the one shell both platforms render (M13-10, F7-48)', () => {
  it('composes the ladder’s home and lists every held home', () => {
    const shell = shellViewFor(['survey_engineer', 'sales_executive'], null);
    expect(shell.home).toEqual({ home: 'sales_executive', composed: ['survey_engineer'] });
    expect(shell.homes).toEqual(['sales_executive', 'survey_engineer']);
  });

  it.each([
    { chosen: null, verb: 'add_lead' },
    { chosen: 'sales_executive', verb: 'add_lead' },
    { chosen: 'survey_engineer', verb: 'start_survey' },
  ] as const)(
    'keeps the ladder-top preset’s slots whatever home is chosen: $chosen → $verb',
    ({ chosen, verb }) => {
      const shell = shellViewFor(['sales_executive', 'survey_engineer'], chosen);
      expect(shell.destinations).toEqual(['home', 'leads', 'proposals', 'more']);
      expect(shell.centreVerb).toBe(verb);
    },
  );

  it.each([
    { chosen: null, marks: ['switch-home', 'centre-action'] },
    { chosen: 'design_engineer', marks: ['switch-home'] },
  ] as const)('takes the marks from the home in force: $chosen → $marks', ({ chosen, marks }) => {
    expect(shellViewFor(['sales_executive', 'design_engineer'], chosen).coachMarks).toEqual(marks);
  });

  it('gives a person with no preset nothing to render', () => {
    expect(shellViewFor([], null)).toEqual({
      home: null,
      homes: [],
      centreVerb: null,
      destinations: null,
      coachMarks: [],
    });
  });
});
