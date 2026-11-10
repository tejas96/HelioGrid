import { describe, expect, it } from 'vitest';
import { judgeLeadImportRows, readLeadImportRow } from '../../src/crm/lead-import-rows';
import { IN_FORMATS } from '../../src/format/pack';

const PHONE = '+919845027746';

describe('reading one row of an old spreadsheet of leads (M02-19, M02-21)', () => {
  it.each([
    ['as stored', PHONE, PHONE],
    ['national, spaced', '98450 27746', PHONE],
    ['with the trunk zero', '098450-27746', PHONE],
    ['in Devanagari digits', '९८४५० २७७४६', PHONE],
  ])('a number written %s reads as its E.164', (_how, cell, expected) => {
    expect(readLeadImportRow({ phone: cell }, IN_FORMATS)).toMatchObject({
      landable: true,
      phoneE164: expected,
    });
  });

  it.each([
    ['no number', { name: 'Asha' }, null, ['missing_number']],
    ['a blank number', { phone: '  ' }, null, ['missing_number']],
    ['nine digits', { phone: '984502774' }, null, ['unreadable_number']],
    [
      'a bill that is no amount',
      { phone: PHONE, monthly_bill: 'about 3k' },
      PHONE,
      ['malformed_row'],
    ],
    ['a negative bill', { phone: PHONE, monthly_bill: '-3500' }, PHONE, ['malformed_row']],
    ['a type that is no segment', { phone: PHONE, segment: 'Spaceship' }, PHONE, ['malformed_row']],
    [
      'an unreadable number and a bad bill',
      { phone: '12', monthly_bill: 'x' },
      null,
      ['unreadable_number', 'malformed_row'],
    ],
  ])('a row with %s is rejected with every reason', (_what, cells, phoneE164, problems) => {
    expect(readLeadImportRow(cells, IN_FORMATS)).toEqual({ landable: false, phoneE164, problems });
  });

  it.each([
    ['Residential', 'residential'],
    ['home', 'residential'],
    ['घरेलू', 'residential'],
    ['निवासी', 'residential'],
    ['C&I', 'commercial'],
    ['Commercial & Industrial', 'commercial'],
    ['व्यावसायिक', 'commercial'],
    ['', null],
  ])('the type %j reads as the segment %s', (cell, segment) => {
    const read = readLeadImportRow({ phone: PHONE, segment: cell }, IN_FORMATS);
    expect(read).toMatchObject({ landable: true, lead: { segment } });
  });

  it.each([
    ['3500', 350_000],
    ['3,500', 350_000],
    ['₹ 1,32,000', 13_200_000],
    ['0', 0],
    ['', null],
  ])('the bill %j reads as %s minor units', (cell, monthlyBill) => {
    const read = readLeadImportRow({ phone: PHONE, monthly_bill: cell }, IN_FORMATS);
    expect(read).toMatchObject({ landable: true, lead: { monthlyBill } });
  });

  it('a name and a city are kept as written, without their outer spaces', () => {
    const read = readLeadImportRow(
      { phone: PHONE, name: ' Priya Sharma ', city: 'Nashik' },
      IN_FORMATS,
    );
    expect(read).toMatchObject({ lead: { name: 'Priya Sharma', city: 'Nashik' } });
  });
});

describe('judging a sheet: two rows with one number', () => {
  it('the first lands and a later one names it; a rejected row is no first', () => {
    const judged = judgeLeadImportRows(
      [
        { rowNumber: 2, cells: { phone: PHONE, monthly_bill: 'x' } },
        { rowNumber: 3, cells: { phone: '98450 27746' } },
        { rowNumber: 4, cells: { phone: '+91 98450 27746' } },
        { rowNumber: 5, cells: { phone: '+919845027747' } },
      ],
      IN_FORMATS,
    );
    expect(judged.map((row) => [row.rowNumber, row.problems, row.repeatsRow])).toEqual([
      [2, ['malformed_row'], null],
      [3, [], null],
      [4, [], 3],
      [5, [], null],
    ]);
  });
});
