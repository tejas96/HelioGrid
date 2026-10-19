import { describe, expect, it } from 'vitest';
import { DOOR_SEGMENT } from '../../src/shell/doors';
import {
  firstSettingsPageBeside,
  opensSettingsRow,
  SETTINGS_ROWS,
  SETTINGS_SEGMENT,
  settingsRowOfSegment,
  settingsRowsFor,
} from '../../src/shell/settings-rows';

describe('settingsRowsFor — the rows a person’s presets open (F7-48, the F2 matrix)', () => {
  it.each([
    {
      who: 'an EPC Owner — every group, every row, in the page’s order',
      held: ['epc_owner'],
      groups: [
        { group: 'you', rows: ['profile'] },
        { group: 'team', rows: ['team', 'roles'] },
        {
          group: 'company',
          rows: ['company_profile', 'branding', 'proposal_templates', 'payment_terms'],
        },
        { group: 'catalog', rows: ['catalog'] },
        { group: 'agent', rows: ['agent'] },
        { group: 'money', rows: ['collections', 'billing', 'usage'] },
      ],
    },
    {
      who: 'a Field Technician — their own settings alone',
      held: ['field_technician'],
      groups: [{ group: 'you', rows: ['profile'] }],
    },
    {
      who: 'Finance — the catalog by its limited grant, never Collections or Usage',
      held: ['finance'],
      groups: [
        { group: 'you', rows: ['profile'] },
        { group: 'catalog', rows: ['catalog'] },
      ],
    },
    {
      who: 'Operations — the catalog outright',
      held: ['operations'],
      groups: [
        { group: 'you', rows: ['profile'] },
        { group: 'catalog', rows: ['catalog'] },
      ],
    },
    {
      who: 'Finance and Operations together — the wider grant, one row',
      held: ['finance', 'operations'],
      groups: [
        { group: 'you', rows: ['profile'] },
        { group: 'catalog', rows: ['catalog'] },
      ],
    },
    {
      who: 'a person holding no preset — the row everyone has',
      held: [],
      groups: [{ group: 'you', rows: ['profile'] }],
    },
  ] as const)('$who', ({ held, groups }) => {
    expect(settingsRowsFor(held)).toEqual(groups);
  });

  it('never hands Finance the owner’s money rows', () => {
    const rows = settingsRowsFor(['finance']).flatMap((group) => group.rows);
    expect(rows).not.toContain('usage');
    expect(rows).not.toContain('collections');
    expect(rows).not.toContain('billing');
  });
});

describe('opensSettingsRow — one row, asked by name (the refusal a row’s address answers)', () => {
  it.each([
    ['Finance never opens Usage', ['finance'], 'usage', false],
    ['Finance opens the catalog by its limited grant', ['finance'], 'catalog', true],
    ['a person holding no preset opens their own settings', [], 'profile', true],
    ['a Field Technician never opens Team', ['field_technician'], 'team', false],
    ['an EPC Owner opens Collections', ['epc_owner'], 'collections', true],
  ] as const)('%s', (_, held, row, opens) => {
    expect(opensSettingsRow(held, row)).toBe(opens);
  });
});

describe('SETTINGS_SEGMENT — one address per row under More (M01-61)', () => {
  it('gives every row a distinct plain address word, none a door’s', () => {
    const segments = SETTINGS_ROWS.map((row) => SETTINGS_SEGMENT[row]);
    expect(new Set(segments).size).toBe(SETTINGS_ROWS.length);
    for (const segment of segments) {
      expect(segment).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(Object.values(DOOR_SEGMENT)).not.toContain(segment);
    }
  });

  it.each([
    ['team', 'team'],
    ['company-profile', 'company_profile'],
    ['payment-terms', 'payment_terms'],
  ] as const)('reads %s back as the row %s', (segment, row) => {
    expect(settingsRowOfSegment(segment)).toBe(row);
  });

  it.each(['', 'not-a-row', 'Team', 'leads'])('answers null for %j', (segment) => {
    expect(settingsRowOfSegment(segment)).toBeNull();
  });
});

describe('firstSettingsPageBeside — the page More opens at the desktop width, beside the list', () => {
  it.each([
    {
      who: 'an EPC Owner — twelve rows: the first, Profile & preferences',
      held: ['epc_owner'],
      page: 'profile',
    },
    {
      who: 'a Finance holder — several rows: the first, Profile & preferences',
      held: ['finance'],
      page: 'profile',
    },
    {
      who: 'a Field Technician — one row: no side list, the list page stays',
      held: ['field_technician'],
      page: null,
    },
    { who: 'no preset — one row: the list page stays', held: [], page: null },
  ] as const)('$who', ({ held, page }) => {
    expect(firstSettingsPageBeside(held)).toBe(page);
  });
});
