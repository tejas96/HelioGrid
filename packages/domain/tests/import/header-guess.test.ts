import { describe, expect, it } from 'vitest';
import {
  LEAD_IMPORT_COLUMNS,
  type LeadImportField,
  leadImportColumnsProblem,
  leadImportMappingProblem,
} from '../../src/crm/lead-import-fields';
import type { ImportSheet } from '../../src/import/sheet';

const fieldOf = (header: string) => LEAD_IMPORT_COLUMNS.guessColumns([header])[0]?.field ?? null;

describe('the lead import guesses its columns in English, Hindi and Marathi (M02-19)', () => {
  it.each<[string, LeadImportField | null]>([
    ['Name', 'name'],
    ['Customer Name', 'name'],
    ['CLIENT', 'name'],
    ['नाम', 'name'],
    ['ग्राहक का नाम', 'name'],
    ['ग्राहकाचे नाव', 'name'],
    ['Mobile No.', 'phone'],
    ['Mobile Number', 'phone'],
    ['Phone', 'phone'],
    ['Mob. No.', 'phone'],
    ['Contact No', 'phone'],
    ['WhatsApp No', 'phone'],
    ['मोबाइल', 'phone'],
    ['फोन', 'phone'],
    ['फ़ोन नंबर', 'phone'],
    ['मोबाईल क्रमांक', 'phone'],
    ['City', 'city'],
    ['Town', 'city'],
    ['Village', 'city'],
    ['शहर', 'city'],
    ['गाव', 'city'],
    ['गांव', 'city'],
    ['Category', 'segment'],
    ['Customer Type', 'segment'],
    ['श्रेणी', 'segment'],
    ['Bill Amt', 'monthly_bill'],
    ['Monthly Bill (₹)', 'monthly_bill'],
    ['Bill Amount Rs', 'monthly_bill'],
    ['Electricity Bill', 'monthly_bill'],
    ['बिल', 'monthly_bill'],
    ['मासिक बिल', 'monthly_bill'],
    ['बिजली का बिल', 'monthly_bill'],
    ['वीज बिल', 'monthly_bill'],
    ['Contact', null],
    ['Number', null],
    ['Area', null],
    ['Roof Type', null],
    ['', null],
  ])('each column header guesses its lead field, Hindi headers too — %s', (header, field) => {
    expect(fieldOf(header)).toBe(field);
  });

  it('a field is placed once: the first column naming it wins', () => {
    expect(
      LEAD_IMPORT_COLUMNS.guessColumns(['Mobile', 'Phone', 'नाम']).map((guess) => guess.field),
    ).toEqual(['phone', null, 'name']);
  });

  it('finds a Hindi header row under a title block and proposes its mapping', () => {
    const sheet: ImportSheet = {
      name: 'ग्राहक सूची',
      rowCount: 120,
      columnCount: 5,
      topRows: [
        ['सोलर पूछताछ — अक्टूबर'],
        [],
        ['क्रम', 'ग्राहक का नाम', 'मोबाइल नंबर', 'शहर', 'मासिक बिल'],
      ],
    };
    expect(LEAD_IMPORT_COLUMNS.guessMapping([sheet])).toEqual({
      sheet: 0,
      headerRow: 2,
      columns: [null, 'name', 'phone', 'city', 'monthly_bill'],
    });
  });
});

describe('a lead mapping must place the phone, once (M02-02)', () => {
  it.each<[(LeadImportField | null)[], string | null]>([
    [['phone'], null],
    [['name', 'phone', null, 'city'], null],
    [['name', 'city'], 'required_field_unplaced'],
    [[], 'required_field_unplaced'],
    [['phone', 'phone'], 'field_placed_twice'],
  ])('%j answers %s', (columns, problem) => {
    expect(leadImportColumnsProblem(columns)).toBe(problem);
  });

  it('the server holds a mapping to the sheets it read', () => {
    const sheet: ImportSheet = { name: 'Leads', rowCount: 3, columnCount: 2, topRows: [[], []] };
    const mapping = { sheet: 0, headerRow: 0, columns: ['name', 'phone'] } as const;
    expect(leadImportMappingProblem(mapping, [sheet])).toBeNull();
    expect(leadImportMappingProblem({ ...mapping, sheet: 1 }, [sheet])).toBe('sheet_missing');
    expect(leadImportMappingProblem({ ...mapping, columns: ['name'] }, [sheet])).toBe(
      'required_field_unplaced',
    );
  });
});
