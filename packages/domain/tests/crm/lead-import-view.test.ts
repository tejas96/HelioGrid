import { describe, expect, it } from 'vitest';
import { LEAD_IMPORT_COLUMNS } from '../../src/crm/lead-import-fields';
import {
  leadImportFiguresOf,
  leadImportGate,
  leadImportOutcomeOf,
  leadImportProgressOf,
  leadImportRowFateOf,
  leadImportRowsAskOf,
  leadImportRowViewOf,
  leadImportRunGate,
  leadImportRunPlanOf,
} from '../../src/crm/lead-import-view';
import { importColumnViews, placedHeadersOf } from '../../src/import/columns-view';

describe('the lead import wizard’s view (SCR-M02-05)', () => {
  it('counts 400 rows and 90 duplicates by phone before anything runs, and 310 to create', () => {
    expect(leadImportFiguresOf({ rows: 400, duplicates: 90, rejected: 0 })).toEqual({
      rows: 400,
      duplicates: 90,
      rejected: 0,
      create: 310,
    });
    expect(leadImportFiguresOf({ rows: 12, duplicates: 2, rejected: 3 })?.create).toBe(7);
    expect(leadImportFiguresOf(null)).toBeNull();
  });

  it.each([
    ['skip creates the new rows and logs nothing', 'skip', { create: 310, log: 0 }],
    ['log as enquiry also logs every duplicate', 'log_enquiry', { create: 310, log: 90 }],
  ] as const)('%s', (_, choice, plan) => {
    const figures = { rows: 400, duplicates: 90, rejected: 0, create: 310 };
    expect(leadImportRunPlanOf(figures, choice)).toEqual(plan);
  });

  it.each([
    ['nothing to create or log waits', { create: 0, log: 0 }, 'nothing_to_import'],
    ['only enquiries to log may run', { create: 0, log: 4 }, null],
    ['leads to create may run', { create: 3, log: 0 }, null],
  ] as const)('%s', (_, plan, gate) => {
    expect(leadImportRunGate(plan)).toBe(gate);
  });

  it.each([
    ['no file yet', 'empty', [], 'no_file'],
    ['the file still read', 'reading', [], 'reading'],
    ['the phone unplaced', 'columns', ['name', 'city'], 'columns_unplaced'],
    ['a field placed twice', 'columns', ['phone', 'phone'], 'columns_twice'],
    ['the phone placed once', 'columns', ['name', 'phone', null], null],
    ['the preview pass out', 'matching', ['phone'], 'matching'],
    ['the preview', 'preview', [], null],
  ] as const)('the act waits with %s', (_, frame, columns, gate) => {
    expect(leadImportGate(frame, columns)).toBe(gate);
  });

  it.each([
    ['a new row lands as a lead', { verdict: 'new', result: null }, 'skip', 'new_lead'],
    [
      'a duplicate is skipped by default',
      { verdict: 'duplicate', result: null },
      'skip',
      'will_skip',
    ],
    [
      'a duplicate is logged when that is the choice',
      { verdict: 'duplicate', result: null },
      'log_enquiry',
      'will_log',
    ],
    ['a rejected row lands nothing', { verdict: 'rejected', result: null }, 'skip', 'rejected'],
    ['once run, the result decides', { verdict: 'duplicate', result: 'logged' }, 'skip', 'logged'],
    ['a landed row', { verdict: 'new', result: 'landed' }, 'skip', 'landed'],
    ['a verdict a later server adds', { verdict: 'held', result: null }, 'skip', 'rejected'],
  ] as const)('%s', (_, row, choice, fate) => {
    expect(leadImportRowFateOf(row, choice)).toBe(fate);
  });

  it('the report counts every row the run took, and its duplicates either way', () => {
    expect(leadImportOutcomeOf({ landed: 300, logged: 60, skipped: 30, rejected: 10 })).toEqual({
      landed: 300,
      logged: 60,
      skipped: 30,
      rejected: 10,
      duplicates: 90,
      read: 400,
    });
  });

  it('the run’s share never passes the whole', () => {
    expect(leadImportProgressOf({ done: 100, total: 400 })).toEqual({
      done: 100,
      total: 400,
      share: 0.25,
    });
    expect(leadImportProgressOf({ done: 9, total: 0 }).share).toBe(0);
  });

  it.each([
    ['the preview lists every row', 'preview', null, {}],
    ['the preview narrowed to duplicates', 'preview', 'duplicate', { verdict: 'duplicate' }],
    ['the report lists the rejected rows', 'report', 'new', { result: 'rejected' }],
  ] as const)('%s', (_, phase, scope, ask) => {
    expect(leadImportRowsAskOf(phase, scope)).toEqual(ask);
  });

  it('each column shows its header, two first values and its guessed field', () => {
    const sheets = [
      {
        name: 'Leads',
        rowCount: 4,
        columnCount: 3,
        topRows: [
          ['ग्राहक का नाम', 'Mobile No.', 'Remarks'],
          ['Sachin Pawar', '98221 40318', ''],
          ['Priya Sharma', '98220 14567', 'call after 5'],
          ['Nitin Kale', '98222 90177', 'hot'],
        ],
      },
    ];
    const mapping = LEAD_IMPORT_COLUMNS.guessMapping(sheets);
    const views = importColumnViews(sheets, mapping, LEAD_IMPORT_COLUMNS.mappingForHeader);
    expect(views.matched).toEqual([
      {
        column: 0,
        header: 'ग्राहक का नाम',
        samples: ['Sachin Pawar', 'Priya Sharma'],
        field: 'name',
      },
      { column: 1, header: 'Mobile No.', samples: ['98221 40318', '98220 14567'], field: 'phone' },
    ]);
    expect(views.open).toEqual([
      { column: 2, header: 'Remarks', samples: ['call after 5', 'hot'], field: null },
    ]);
    expect(placedHeadersOf(views)).toEqual([
      { column: 0, header: 'ग्राहक का नाम', field: 'name' },
      { column: 1, header: 'Mobile No.', field: 'phone' },
    ]);
  });

  it('a duplicate row carries its record’s facts and how long since its last contact', () => {
    const match = {
      kind: 'out_of_scope',
      ownerName: 'Rajesh',
      lastContactAt: '2026-11-06T10:00:00Z',
    };
    const row = {
      rowNumber: 3,
      cells: { name: 'Priya', phone: '98220 14567' },
      verdict: 'duplicate',
      problems: ['a_later_reason', 'malformed_row', 'unreadable_number'],
      duplicateOf: match,
      repeatsRow: null,
      result: null,
    };
    const view = leadImportRowViewOf(row, 'log_enquiry', Date.parse('2026-11-10T10:00:00Z'));
    expect(view).toMatchObject({
      id: '3',
      fate: 'will_log',
      match,
      lastContactAgoMs: 4 * 86_400_000,
    });
    expect(view.problems).toEqual(['unreadable_number', 'malformed_row']);
    const fresh = leadImportRowViewOf({ ...row, duplicateOf: null }, 'skip', 0);
    expect(fresh.lastContactAgoMs).toBeNull();
  });
});
