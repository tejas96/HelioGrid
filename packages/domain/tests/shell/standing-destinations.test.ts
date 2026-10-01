import { describe, expect, it } from 'vitest';
import { visibilityIn } from '../../src/authz/policy';
import { ROLE_PRESETS } from '../../src/authz/roles';
import {
  type StandingDestinationSet,
  standingDestinationsFor,
  WORK_DESTINATION_DOMAIN,
  type WorkDestination,
} from '../../src/shell/standing-destinations';

describe('standingDestinationsFor — each preset’s bar, as F7-48 rules it', () => {
  it.each([
    { preset: 'epc_owner', set: ['home', 'leads', 'projects', 'more'] },
    { preset: 'sales_manager', set: ['home', 'leads', 'proposals', 'more'] },
    { preset: 'sales_executive', set: ['home', 'leads', 'proposals', 'more'] },
    { preset: 'survey_engineer', set: ['home', 'leads', 'more'] },
    { preset: 'design_engineer', set: ['home', 'leads', 'proposals', 'more'] },
    { preset: 'project_manager', set: ['home', 'more'] },
    { preset: 'field_technician', set: ['home', 'more'] },
    { preset: 'installation_team_member', set: ['home', 'more'] },
    { preset: 'hr_admin', set: ['home', 'people', 'more'] },
    { preset: 'finance', set: ['home', 'projects', 'more'] },
    { preset: 'operations', set: ['home', 'leads', 'projects', 'more'] },
    { preset: 'marketing', set: ['home', 'campaigns', 'leads', 'more'] },
  ] as const)('$preset → $set', ({ preset, set }) => {
    expect(standingDestinationsFor(preset)).toEqual(set);
  });

  it.each(ROLE_PRESETS)('%s: a set is Home, up to two distinct lists, then More', (preset) => {
    const set = standingDestinationsFor(preset);
    expect(set[0]).toBe('home');
    expect(set[set.length - 1]).toBe('more');
    expect(set.length).toBeLessThanOrEqual(4);
    expect(new Set(set).size).toBe(set.length);
  });

  it('refuses a fifth slot, a moved Home and More not last', () => {
    // @ts-expect-error — a fifth slot
    const fifth: StandingDestinationSet = ['home', 'leads', 'proposals', 'projects', 'more'];
    // @ts-expect-error — Home moved off the first slot
    const movedHome: StandingDestinationSet = ['leads', 'home', 'more'];
    // @ts-expect-error — More before a list
    const moreFirst: StandingDestinationSet = ['home', 'more', 'leads'];
    expect([fifth, movedHome, moreFirst]).toHaveLength(3);
  });
});

describe('a slot is never a list the preset’s own visibility calls none (F2-12, F7-48)', () => {
  it.each(ROLE_PRESETS)('%s sees every list under its thumb', (preset) => {
    const lists = standingDestinationsFor(preset).slice(1, -1) as readonly WorkDestination[];
    for (const list of lists) {
      const seen = visibilityIn([preset], WORK_DESTINATION_DOMAIN[list]);
      const seesSomething =
        seen.scope !== 'none' || seen.includesAssigned || seen.through.length > 0;
      expect(seesSomething, `${preset} cannot see ${list}`).toBe(true);
    }
  });
});
