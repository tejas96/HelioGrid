import { describe, expect, it } from 'vitest';
import { visibilityIn } from '../../src/authz/policy';
import { ROLE_PRESETS } from '../../src/authz/roles';
import {
  type StandingDestinationSet,
  standingDestinationsFor,
  WORK_DESTINATION_DOMAIN,
} from '../../src/shell/standing-destinations';

const SALES: StandingDestinationSet = ['home', 'leads', 'proposals', 'more'];

describe('standingDestinationsFor — the persona’s few standing destinations (F7-22)', () => {
  it.each([
    {
      preset: 'epc_owner',
      set: SALES,
      by: 'SCR-SHELL-01 decision 5 — Home · Leads · Proposals · More',
    },
    { preset: 'sales_manager', set: SALES, by: 'SCR-SHELL-01 decision 5' },
    { preset: 'sales_executive', set: SALES, by: 'SCR-SHELL-01 decision 5' },
    {
      preset: 'survey_engineer',
      set: null,
      by: 'no row names the surveyor’s two lists — the home’s task does',
    },
    { preset: 'finance', set: null, by: 'sees no leads (F2-12) and no row names another list' },
  ] as const)('$preset → $set ($by)', ({ preset, set }) => {
    expect(standingDestinationsFor(preset)).toEqual(set);
  });

  it.each(ROLE_PRESETS)(
    '%s: a named set is four distinct slots, Home first and More last',
    (preset) => {
      const set = standingDestinationsFor(preset);
      if (set === null) return;
      expect(set).toHaveLength(4);
      expect(set[0]).toBe('home');
      expect(set[3]).toBe('more');
      expect(new Set(set).size).toBe(4);
    },
  );
});

describe('a slot is never a list the preset’s own visibility calls none (F2-12)', () => {
  it.each(ROLE_PRESETS)('%s sees every list under its thumb', (preset) => {
    const set = standingDestinationsFor(preset);
    if (set === null) return;
    for (const slot of [set[1], set[2]]) {
      const seen = visibilityIn([preset], WORK_DESTINATION_DOMAIN[slot]);
      const seesSomething =
        seen.scope !== 'none' || seen.includesAssigned || seen.through.length > 0;
      expect(seesSomething, `${preset} cannot see ${slot}`).toBe(true);
    }
  });
});
