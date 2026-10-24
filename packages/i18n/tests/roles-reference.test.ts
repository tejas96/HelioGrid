import { ROLE_PRESETS, type RolePreset, roleHolders, type TeamRow } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { rolesReferenceWords } from '../src/copy/roles-reference';
import { createTranslator } from '../src/runtime';

const member = (name: string, status: TeamRow['status'], roles: RolePreset[]): TeamRow => ({
  id: name,
  name,
  phoneE164: '+919800000000',
  roles,
  status,
  isViewer: false,
  lastActiveAt: null,
  expiresAt: null,
  inviteDay: null,
});

/* By place in F2's order, never by spelling: a role name is the permission model's to write. */
const [OWNER, , SALES_EXECUTIVE, , , , , , , FINANCE] = ROLE_PRESETS;

const ROSTER = [
  member('Priya Deshmukh', 'invited', [SALES_EXECUTIVE]),
  member('Amit Rane', 'active', [SALES_EXECUTIVE]),
  member('Anjali Kulkarni', 'active', [SALES_EXECUTIVE]),
  member('Rajesh Kulkarni', 'active', [OWNER]),
];

async function words(language: 'en' | 'hi' | 'mr', read = true) {
  const { t } = await createTranslator(language);
  return rolesReferenceWords(t, read ? roleHolders(ROSTER) : null);
}

describe('rolesReferenceWords — the board, word for word', () => {
  it('names the twelve in F2 order, each with its summary and count', async () => {
    const { presets } = await words('en');
    expect(presets.map((preset) => preset.value)).toEqual([...ROLE_PRESETS]);
    expect(presets[0]).toMatchObject({
      name: 'EPC Owner',
      summary: 'Everything, always',
      count: '1 person',
    });
    expect(presets[2]).toMatchObject({
      name: 'Sales Executive',
      count: '2 people',
      holders: ['Amit Rane', 'Anjali Kulkarni'],
      others: [{ name: 'Priya Deshmukh', status: 'invited', word: 'Invited' }],
    });
    expect(presets[1]?.count).toBe('0 people');
  });

  it('a count waits, or is missing, until the roster is read', async () => {
    const { presets } = await words('en', false);
    expect(presets.every((preset) => preset.count === null)).toBe(true);
    expect(presets[0]?.loadingCount).toBe('Loading how many people hold EPC Owner');
  });

  it('lists what a role can and cannot do, with the person’s part of a scope', async () => {
    const finance = (await words('en')).presets.find((preset) => preset.value === FINANCE);
    expect(finance?.can).toContainEqual({
      key: 'onboarding.manage_catalog',
      text: 'Manage catalog and price book',
      scope: 'View prices & margins',
    });
    expect(finance?.cant[0]).toEqual({
      key: 'onboarding.manage_team',
      text: 'Manage team and roles',
      scope: null,
    });
    expect(finance?.canTab).toBe(`Can do · ${finance?.can.length}`);
    expect(finance?.cantTab).toBe(`Can’t · ${finance?.cant.length}`);
  });

  it.each(['hi', 'mr'] as const)('every word is the %s catalog’s', async (language) => {
    const english = await words('en');
    const local = await words(language);
    for (const [index, preset] of local.presets.entries()) {
      const source = english.presets[index];
      expect(preset.summary).not.toBe(source?.summary);
      expect(preset.can.map((row) => row.text)).not.toContain(source?.can[0]?.text);
    }
    expect(local.lede).not.toBe(english.lede);
  });
});
