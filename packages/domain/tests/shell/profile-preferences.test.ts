import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../../src/auth/session';
import { profilePreferencesView, pushSwitches } from '../../src/shell/profile-preferences';

const anjali: SessionUser = {
  id: '8f0c2d1e-0000-4000-8000-0000000000a1',
  name: 'Anjali Kulkarni',
  phoneE164: '+919876543210',
  interfaceLanguage: 'en',
  unitPreference: 'metric',
  tenant: { id: '8f0c2d1e-0000-4000-8000-000000000001', roles: ['sales_executive'] },
};

describe('profilePreferencesView', () => {
  it('lists every UI language for the picker, the one in use chosen', () => {
    const view = profilePreferencesView({ user: anjali, device: 'en', marketUnits: 'metric' });
    expect(view.language.options).toEqual(['en', 'hi', 'mr']);
    expect(view.language.value).toBe('en');
  });

  it.each([
    ['equals the device', 'hi', 'hi', 'inherited'],
    ['differs from the device', 'mr', 'hi', 'own'],
    ['has no device language in the set', 'en', null, 'own'],
  ] as const)('a language that %s reads %s', (_, language, device, source) => {
    const user = { ...anjali, interfaceLanguage: language };
    expect(profilePreferencesView({ user, device, marketUnits: 'metric' }).language.source).toBe(
      source,
    );
  });

  it.each([
    ['the market default', 'metric', 'metric', 'inherited'],
    ['another than the market default', 'imperial', 'metric', 'own'],
    ['the default of an imperial market', 'imperial', 'imperial', 'inherited'],
  ] as const)('a unit that is %s reads %s', (_, unit, market, source) => {
    const user = { ...anjali, unitPreference: unit };
    const view = profilePreferencesView({ user, device: 'en', marketUnits: market });
    expect(view.units).toEqual({ value: unit, source });
  });

  it.each([
    ['one preset', ['sales_executive'], ['sales_executive']],
    [
      'three presets, every one, no cap',
      ['survey_engineer', 'design_engineer', 'installation_team_member'],
      ['survey_engineer', 'design_engineer', 'installation_team_member'],
    ],
  ] as const)('shows the roles of %s', (_, roles, shown) => {
    const user = { ...anjali, tenant: { id: 't', roles } };
    expect(profilePreferencesView({ user, device: 'en', marketUnits: 'metric' }).roles).toEqual(
      shown,
    );
  });

  it('shows no role for a person with no company yet', () => {
    const user = { ...anjali, tenant: null };
    expect(profilePreferencesView({ user, device: 'en', marketUnits: 'metric' }).roles).toEqual([]);
  });
});

describe('pushSwitches — the push section as the page draws it (F6-15)', () => {
  const row = (group: string, pushMuted: boolean, mutable = true) => ({
    group: group as 'sales',
    pushMuted,
    mutable,
  });
  const FOUR_ON = ['sales', 'delivery', 'payments', 'team'].map((group) => row(group, false));

  it('draws a switch on while push is on, off once the group is muted (brief decision 3)', () => {
    const switches = pushSwitches(
      [...FOUR_ON.slice(0, 2), row('payments', true), row('team', false)],
      ['sales_executive'],
    );
    expect(switches).toEqual([
      { group: 'sales', on: true, locked: false },
      { group: 'delivery', on: true, locked: false },
      { group: 'payments', on: false, locked: false },
      { group: 'team', on: true, locked: false },
    ]);
  });

  it('draws the Owner’s Billing last, on and locked', () => {
    const switches = pushSwitches([row('billing', false, false), ...FOUR_ON], ['epc_owner']);
    expect(switches.map((one) => one.group)).toEqual([
      'sales',
      'delivery',
      'payments',
      'team',
      'billing',
    ]);
    expect(switches.at(-1)).toEqual({ group: 'billing', on: true, locked: true });
  });

  it.each([
    ['a Billing row a non-Owner was sent', [...FOUR_ON, row('billing', false)], 4],
    ['a group the answer left out', FOUR_ON.slice(1), 3],
    ['no answer rows at all', [], 0],
  ] as const)('draws no switch for %s', (_, preferences, count) => {
    expect(pushSwitches(preferences, ['sales_executive'])).toHaveLength(count);
  });
});
