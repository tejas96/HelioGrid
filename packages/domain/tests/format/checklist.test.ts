import { describe, expect, it } from 'vitest';
import { checklistForDeal } from '../../src/format/checklist';
import { packLabel } from '../../src/format/languages';
import { IN_FORMATS } from '../../src/format/pack';
import { IN_SUBSIDY, type SubsidyPack } from '../../src/subsidy/pack';

const ROWS = IN_FORMATS.documentChecklist;

describe('the IN project document checklist (F1-52, F1-35)', () => {
  it('seeds all ten rows for a residential deal, in the order the work meets them (F1-52, owner ruling 2026-11-10)', () => {
    const rows = checklistForDeal(ROWS, IN_SUBSIDY, 'residential');
    expect(rows.map((r) => r.row)).toEqual([
      'signed_proposal',
      'advance_receipt',
      'utility_feasibility',
      'net_metering_application',
      'utility_approval',
      'electrical_inspector_approval',
      'commissioning_certificate',
      'incentive_application',
      'warranty_documents',
      'handover_pack',
    ]);
  });

  it('omits the subsidy row for a commercial deal, and only that row', () => {
    const commercial = checklistForDeal(ROWS, IN_SUBSIDY, 'commercial');
    expect(commercial).toHaveLength(9);
    expect(commercial.map((r) => r.row)).not.toContain('incentive_application');
  });

  it.each([
    ['utility_feasibility', 'hi'],
    ['utility_feasibility', 'mr'],
    ['utility_approval', 'hi'],
    ['utility_approval', 'mr'],
  ] as const)(
    'reads the %s row in %s, keeping the name DISCOM as written (F3-08, F3-09)',
    (key, language) => {
      const row = ROWS.find((r) => r.row === key);
      const label = row ? packLabel(row.label, language) : '';
      expect(label).toMatch(/^DISCOM /);
      expect(label).not.toBe(row && packLabel(row.label, 'en'));
    },
  );

  it.each(['hi', 'mr'] as const)(
    'labels every row in %s, never falling back to English',
    (language) => {
      const english = ROWS.filter((r) => packLabel(r.label, language) === packLabel(r.label, 'en'));
      expect(english.map((r) => r.row)).toEqual([]);
    },
  );

  it('drops the subsidy row everywhere in a market that offers no incentive (F1-14)', () => {
    const noSubsidy: SubsidyPack = { offered: false };
    expect(checklistForDeal(ROWS, noSubsidy, 'residential')).toHaveLength(9);
  });
});
