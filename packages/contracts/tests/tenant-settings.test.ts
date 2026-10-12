import { describe, expect, it } from 'vitest';
import {
  businessProfileReadSchema,
  businessProfileSchema,
  businessProfileWriteSchema,
  calendarDateSchema,
  hexColourSchema,
  taxRegistrationsSchema,
  trancheLineSchema,
} from '../src';
import { packLabelSchema, richTextValueSchema } from '../src/document-content';

describe('a per-language value on the wire — English required, a stranger language refused (F3-05)', () => {
  it.each([[{ en: 'Standard' }], [{ en: 'Standard', hi: 'मानक', mr: 'मानक' }]])(
    'accepts %o',
    (label) => {
      expect(packLabelSchema.safeParse(label).success).toBe(true);
    },
  );

  it.each([[{ hi: 'मानक' }], [{ en: 'Standard', fr: 'Standard' }], [{ en: '' }], [{}]])(
    'refuses %o',
    (label) => {
      expect(packLabelSchema.safeParse(label).success).toBe(false);
    },
  );
});

describe('rich text on the wire — a block list, never HTML (M06-51)', () => {
  it('accepts every block kind and refuses an unknown one', () => {
    expect(
      richTextValueSchema.safeParse({
        version: 1,
        blocks: [
          { type: 'h', spans: [{ text: 'Terms', b: true }] },
          { type: 'ul', items: [[{ text: 'one' }], [{ text: 'two', href: 'https://x.y' }]] },
          { type: 'logo' },
        ],
      }).success,
    ).toBe(true);
    expect(
      richTextValueSchema.safeParse({ version: 1, blocks: [{ type: 'html', html: '<b>' }] })
        .success,
    ).toBe(false);
    expect(richTextValueSchema.safeParse({ version: 2, blocks: [] }).success).toBe(false);
  });
});

describe('the small shapes at their edges', () => {
  it.each([
    ['#abc', true],
    ['#AABBCC', true],
    ['#abcd', false],
    ['red', false],
  ])('a colour %s is %s', (value, ok) => {
    expect(hexColourSchema.safeParse(value).success).toBe(ok);
  });

  it.each([
    ['2026-08-15', true],
    ['2026-02-29', false],
    ['2028-02-29', true],
    ['15-08-2026', false],
  ])('a day %s is %s', (value, ok) => {
    expect(calendarDateSchema.safeParse(value).success).toBe(ok);
  });

  it('binds a tranche to a chain stage in two-decimal percent, never the terminal', () => {
    const line = { label: { en: 'On signing' }, percent: '10.00', dueOnStage: 'won' };
    expect(trancheLineSchema.safeParse(line).success).toBe(true);
    expect(trancheLineSchema.safeParse({ ...line, dueOnStage: 'cancelled' }).success).toBe(false);
    expect(trancheLineSchema.safeParse({ ...line, percent: '10' }).success).toBe(false);
    expect(trancheLineSchema.safeParse({ ...line, percent: '100.01' }).success).toBe(false);
  });
});

describe('tax registrations on the wire — one entry per type (M01-24)', () => {
  const one = { registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' };

  it('accepts one entry per type, and an empty list', () => {
    expect(taxRegistrationsSchema.safeParse({ registrations: [one] }).success).toBe(true);
    expect(taxRegistrationsSchema.safeParse({ registrations: [] }).success).toBe(true);
  });

  it('refuses a second entry of a type already listed, on that entry’s field', () => {
    const result = taxRegistrationsSchema.safeParse({
      registrations: [one, { ...one, value: '29ABCDE1234F1Z5' }],
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error('expected a refusal');
    expect(result.error.issues.map((issue) => issue.path)).toEqual([
      ['registrations', 1, 'registrationType'],
    ]);
  });
});

describe('the business profile on the wire — each bound at its edge (M01-23, M01-24)', () => {
  const profile = {
    companyName: 'Sunrise Solar',
    city: 'Pune',
    segment: null,
    typicalSystemKwp: null,
    address: null,
    postalCode: null,
    bankDetails: null,
  };

  it.each([
    [999_999.99, true],
    [1_000_000, false],
    [0.01, true],
    [0.004, false],
    [5.125, false],
    [1e-7, false],
    [-1, false],
  ])(
    'a typical size of %s kWp is %s — the column holds two decimals under a million',
    (kwp, ok) => {
      const result = businessProfileWriteSchema.safeParse({ ...profile, typicalSystemKwp: kwp });
      expect(result.success).toBe(ok);
    },
  );

  it.each([
    ['4'.repeat(16), true],
    ['4'.repeat(17), false],
    ['', false],
  ])('a PIN code %o is %s', (postalCode, ok) => {
    expect(businessProfileWriteSchema.safeParse({ ...profile, postalCode }).success).toBe(ok);
  });

  it('takes a write that never names the PIN code, and never a read without one', () => {
    const { postalCode: _unread, ...fromAnOlderClient } = profile;
    expect(businessProfileWriteSchema.safeParse(fromAnOlderClient).success).toBe(true);
    expect(businessProfileSchema.safeParse(fromAnOlderClient).success).toBe(false);
  });
});

describe('bank details typed half way on the wire — one to three facts, never beside the whole (M06-17)', () => {
  const profile = {
    companyName: 'Sunrise Solar',
    city: 'Pune',
    segment: null,
    typicalSystemKwp: null,
    address: null,
    postalCode: null,
    bankDetails: null,
  };
  const nothingTyped = {
    bankName: null,
    accountName: null,
    accountNumber: null,
    bankRoutingIdentifier: null,
  };
  const whole = {
    bankName: 'HDFC Bank',
    accountName: 'Sunrise Solar',
    accountNumber: '50100123454821',
    bankRoutingIdentifier: 'HDFC0001234',
  };
  const refusalsOf = (write: unknown) => {
    const result = businessProfileWriteSchema.safeParse(write);
    return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
  };

  it.each([
    ['one fact', { ...nothingTyped, bankName: 'HDFC Bank' }],
    ['two facts', { ...nothingTyped, bankName: 'HDFC Bank', accountNumber: '5010' }],
    ['three facts', { ...whole, bankRoutingIdentifier: null }],
    ['none, said as null', null],
  ])('takes a write with %s', (_what, bankDetailsTyped) => {
    expect(refusalsOf({ ...profile, bankDetailsTyped })).toEqual([]);
  });

  it('takes a write that never names it, from a client built before the field', () => {
    expect(refusalsOf(profile)).toEqual([]);
  });

  it.each([
    ['four facts, which are bank details', { ...profile, bankDetailsTyped: whole }],
    ['no fact at all', { ...profile, bankDetailsTyped: nothingTyped }],
    [
      'a half beside whole bank details',
      { ...profile, bankDetails: whole, bankDetailsTyped: { ...nothingTyped, bankName: 'HDFC' } },
    ],
  ])('refuses %s, on the field', (_what, write) => {
    expect(refusalsOf(write)).toEqual(['bankDetailsTyped']);
  });

  it.each([
    ['4'.repeat(34), []],
    ['4'.repeat(35), ['bankDetailsTyped.accountNumber']],
    ['', ['bankDetailsTyped.accountNumber']],
  ])('an account number %o typed alone is refused at %o', (accountNumber, refused) => {
    const bankDetailsTyped = { ...nothingTyped, accountNumber };
    expect(refusalsOf({ ...profile, bankDetailsTyped })).toEqual(refused);
  });

  it('reads a profile with the half, with none, and from an api built before the field', () => {
    const half = { ...nothingTyped, bankName: 'HDFC Bank' };
    expect(businessProfileReadSchema.parse({ ...profile, bankDetailsTyped: half })).toEqual({
      ...profile,
      bankDetailsTyped: half,
    });
    expect(
      businessProfileReadSchema.safeParse({ ...profile, bankDetailsTyped: null }).success,
    ).toBe(true);
    expect(businessProfileReadSchema.safeParse(profile).success).toBe(true);
  });

  it('keeps the half off the profile a document reads', () => {
    const half = { ...nothingTyped, bankName: 'HDFC Bank' };
    expect(businessProfileSchema.parse({ ...profile, bankDetailsTyped: half })).toEqual(profile);
  });
});
