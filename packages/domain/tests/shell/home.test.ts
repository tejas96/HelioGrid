import { describe, expect, it } from 'vitest';
import { ROLE_PRESETS } from '../../src/authz/roles';
import { composedHome, homeFor, homesOf } from '../../src/shell/home';

describe('homesOf — each held preset once, in ladder order (M13-10)', () => {
  it('gives every one of the twelve presets exactly one rung', () => {
    expect(homesOf(ROLE_PRESETS)).toHaveLength(ROLE_PRESETS.length);
  });

  it.each([
    { held: [], homes: [] },
    { held: ['finance'], homes: ['finance'] },
    {
      held: ['installation_team_member', 'epc_owner', 'sales_executive'],
      homes: ['epc_owner', 'sales_executive', 'installation_team_member'],
    },
    {
      held: ['survey_engineer', 'sales_executive', 'survey_engineer'],
      homes: ['sales_executive', 'survey_engineer'],
    },
  ] as const)('lists $held as $homes', ({ held, homes }) => {
    expect(homesOf(held)).toEqual(homes);
  });
});

describe('homeFor — the highest-ladder held preset is the front door (M13-10)', () => {
  it.each([
    {
      held: ['survey_engineer', 'sales_executive'],
      home: 'sales_executive',
      by: 'rep + surveyor → My Day',
    },
    {
      held: ['installation_team_member', 'field_technician', 'survey_engineer'],
      home: 'survey_engineer',
      by: 'the ruling’s own three-role example → today’s visits',
    },
    {
      held: ['sales_executive', 'epc_owner'],
      home: 'epc_owner',
      by: 'an owner who also sells → the owner dashboard',
    },
    {
      held: ['sales_executive', 'marketing'],
      home: 'marketing',
      by: 'demand generation and selling → campaigns first',
    },
    {
      held: ['design_engineer'],
      home: 'design_engineer',
      by: 'one preset: the ladder is trivial (M13-09)',
    },
    { held: [], home: null, by: 'nothing held: no home — the guard already refused them (F2-21)' },
  ] as const)('$held → $home ($by)', ({ held, home }) => {
    expect(homeFor(held)).toBe(home);
  });

  it('answers from the set alone — order typed and repeats change nothing (F2-15)', () => {
    const typed = ['survey_engineer', 'sales_executive', 'survey_engineer'] as const;
    expect(homeFor(typed)).toBe(homeFor([...typed].reverse()));
    expect(homeFor(typed)).toBe('sales_executive');
  });
});

describe('composedHome — one home, the other held presets composed inside it (M13-10)', () => {
  it.each([
    {
      held: ['survey_engineer', 'sales_executive'],
      chosen: null,
      result: { home: 'sales_executive', composed: ['survey_engineer'] },
      by: 'rep + surveyor lands on My Day with visits inside',
    },
    {
      held: ['installation_team_member', 'field_technician', 'survey_engineer'],
      chosen: null,
      result: {
        home: 'survey_engineer',
        composed: ['field_technician', 'installation_team_member'],
      },
      by: 'today’s visits with the route and the job composed in, ladder order',
    },
    {
      held: ['sales_executive', 'epc_owner'],
      chosen: 'sales_executive',
      result: { home: 'sales_executive', composed: ['epc_owner'] },
      by: 'the owner switches to My Day: one switch away, the dashboard now composed',
    },
    {
      held: ['sales_executive', 'survey_engineer'],
      chosen: 'finance',
      result: { home: 'sales_executive', composed: ['survey_engineer'] },
      by: 'a switch to a preset not held falls back to the ladder, never a blank',
    },
    {
      held: ['hr_admin'],
      chosen: null,
      result: { home: 'hr_admin', composed: [] },
      by: 'one preset composes nothing',
    },
    { held: [], chosen: 'epc_owner', result: null, by: 'nothing held: nothing to compose' },
  ] as const)('$held chosen $chosen → $result ($by)', ({ held, chosen, result }) => {
    expect(composedHome(held, chosen)).toEqual(result);
  });

  it.each([
    ['epc_owner', 'sales_manager', 'operations'],
    ['marketing', 'sales_executive'],
    ['field_technician', 'survey_engineer', 'installation_team_member', 'design_engineer'],
  ] as const)('never composes the home into itself: %s', (...held) => {
    for (const chosen of [null, ...held]) {
      const result = composedHome(held, chosen);
      expect(result).not.toBeNull();
      expect(result?.composed).not.toContain(result?.home);
      expect(result?.composed).toHaveLength(held.length - 1);
    }
  });
});
