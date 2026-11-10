import { describe, expect, it } from 'vitest';
import type { RolePreset } from '../../src/authz/roles';
import {
  checkableNumberOf,
  type NumberCheck,
  numberCheckOf,
  phoneRefusalOf,
  type QuickAddMatch,
  quickAddCaptureOf,
  quickAddDraftFor,
  quickAddDuplicateOf,
} from '../../src/crm/quick-add-view';
import { IN_FORMATS } from '../../src/format/pack';
import type { Read } from '../../src/shell/read';

const PRIYA: QuickAddMatch = {
  kind: 'visible',
  leadId: 'lead-priya',
  customerId: 'customer-priya',
  name: 'Priya Sharma',
  city: 'Nashik',
  ownerName: 'Rajesh',
  stage: 'qualified',
  lastContactAt: '2026-11-05T06:00:00.000Z',
};
const OUTSIDE: QuickAddMatch = {
  kind: 'out_of_scope',
  leadId: 'lead-far',
  ownerName: 'Venkat',
  stage: 'negotiating',
  lastContactAt: null,
};
const NUMBER = '+919822041234';
const DAY_MS = 86_400_000;
const retry = () => {};

describe('the quick add draft (M02-01, M02-05)', () => {
  it.each([
    ['residential', 'residential'],
    ['ci', 'commercial'],
    ['both', null],
    [null, null],
  ] as const)('a company declared %s starts the type on %s', (declared, segment) => {
    expect(quickAddDraftFor(declared)).toEqual({ phoneE164: '', name: '', city: '', segment });
  });
});

describe('the number the live check asks about (M02-02, M02-07)', () => {
  it.each([
    ['', null],
    ['+91982204', null],
    [NUMBER, NUMBER],
    ['+9109822041234', NUMBER],
    ['+9198220412345', null],
  ])('%s checks as %s', (typed, checkable) => {
    expect(checkableNumberOf(IN_FORMATS, typed)).toBe(checkable);
  });

  it.each([
    ['', { kind: 'missing' }],
    ['+91982204', { kind: 'digits', typed: 6, needed: 10 }],
    ['+9198220412345', { kind: 'digits', typed: 11, needed: 10 }],
    [NUMBER, null],
    ['+9109822041234', null],
  ])('Save on %s is refused with %j', (typed, refusal) => {
    expect(phoneRefusalOf(IN_FORMATS, typed)).toEqual(refusal);
  });
});

describe('what a save sends (M02-03)', () => {
  it('a capture with only a phone sends the number alone, invents nothing', () => {
    const draft = { ...quickAddDraftFor(null), phoneE164: '+9109822041234', name: '  ' };
    expect(quickAddCaptureOf(IN_FORMATS, draft)).toEqual({ phoneE164: NUMBER });
  });

  it('the four fields send trimmed, the segment as chosen', () => {
    const draft = {
      phoneE164: NUMBER,
      name: ' Priya Sharma ',
      city: 'Nashik ',
      segment: 'commercial' as const,
    };
    expect(quickAddCaptureOf(IN_FORMATS, draft)).toEqual({
      phoneE164: NUMBER,
      name: 'Priya Sharma',
      city: 'Nashik',
      segment: 'commercial',
    });
  });

  it('a number that cannot be one sends nothing', () => {
    expect(quickAddCaptureOf(IN_FORMATS, { ...quickAddDraftFor(null), phoneE164: '+9198' })).toBe(
      null,
    );
  });
});

describe('the line under the phone (M02-07)', () => {
  const loading: Read<QuickAddMatch | null> = { kind: 'loading' };
  it.each<[string, string | null, string | null, Read<QuickAddMatch | null>, NumberCheck]>([
    ['a part of a number', null, null, loading, { kind: 'none' }],
    ['typing not yet settled', NUMBER, null, loading, { kind: 'checking' }],
    ['the ask out', NUMBER, NUMBER, loading, { kind: 'checking' }],
    ['no match', NUMBER, NUMBER, { kind: 'ready', value: null }, { kind: 'new' }],
    ['a match', NUMBER, NUMBER, { kind: 'ready', value: PRIYA }, { kind: 'known', match: PRIYA }],
    [
      'a failed check',
      NUMBER,
      NUMBER,
      { kind: 'failed', failure: 'no_connection', retry },
      { kind: 'unchecked' },
    ],
  ])('%s says %j', (_case, checkable, settled, answer, check) => {
    expect(numberCheckOf(checkable, settled, answer)).toEqual(check);
  });
});

describe('the duplicate sheet over the capture (M02-08, M02-09, M02-12)', () => {
  const now = Date.parse(PRIYA.lastContactAt ?? '') + 4 * DAY_MS;

  it('a record in scope shows who it is and opens; one outside shows only the three facts and asks', () => {
    const inside = quickAddDuplicateOf(PRIYA, ['sales_executive'], now);
    expect(inside.record).toEqual({ kind: 'visible', name: 'Priya Sharma', city: 'Nashik' });
    expect(inside.opens).toBe('record');
    expect(inside.lastContactElapsedMs).toBe(4 * DAY_MS);
    const outside = quickAddDuplicateOf(OUTSIDE, ['sales_executive'], now);
    expect(outside.record).toEqual({ kind: 'out_of_scope' });
    expect(outside.opens).toBe('ask_owner');
    expect(outside.lastContactElapsedMs).toBe(null);
  });

  it.each<[string, readonly RolePreset[], QuickAddMatch, boolean]>([
    ['a sales executive, a record in scope', ['sales_executive'], PRIYA, true],
    ['a survey engineer, a record in scope', ['survey_engineer'], PRIYA, false],
    ['an owner, a record outside the scope', ['epc_owner'], OUTSIDE, false],
  ])('keep both is offered to %s: %s', (_who, roles, match, offered) => {
    expect(quickAddDuplicateOf(match, roles, now).canKeepBoth).toBe(offered);
  });
});
