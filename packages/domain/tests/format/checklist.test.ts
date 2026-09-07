import { describe, expect, it } from 'vitest';
import { checklistForDeal } from '../../src/format/checklist';
import { packLabel } from '../../src/format/languages';
import { IN_FORMATS } from '../../src/format/pack';
import { IN_SUBSIDY, type SubsidyPack } from '../../src/subsidy/pack';

const ROWS = IN_FORMATS.documentChecklist;

describe('the IN project document checklist (F1-52, F1-35)', () => {
  it('seeds all eight rows for a residential deal, in the order F1-52 states them', () => {
    const rows = checklistForDeal(ROWS, IN_SUBSIDY, 'residential');
    expect(rows.map((r) => r.row)).toEqual([
      'signed_proposal',
      'advance_receipt',
      'net_metering_application',
      'utility_approval',
      'incentive_application',
      'commissioning_certificate',
      'warranty_documents',
      'handover_pack',
    ]);
  });

  it('omits the subsidy row for a commercial deal, and only that row', () => {
    const commercial = checklistForDeal(ROWS, IN_SUBSIDY, 'commercial');
    expect(commercial).toHaveLength(7);
    expect(commercial.map((r) => r.row)).not.toContain('incentive_application');
  });

  it('labels the utility row "DISCOM approval" — never translated (F3-08)', () => {
    const row = ROWS.find((r) => r.row === 'utility_approval');
    expect(row && packLabel(row.label, 'mr')).toBe('DISCOM approval');
  });

  it('drops the subsidy row everywhere in a market that offers no incentive (F1-14)', () => {
    const noSubsidy: SubsidyPack = { offered: false };
    expect(checklistForDeal(ROWS, noSubsidy, 'residential')).toHaveLength(7);
  });
});
