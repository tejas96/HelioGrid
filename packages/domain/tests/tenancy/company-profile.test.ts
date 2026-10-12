import { describe, expect, it } from 'vitest';
import { IN_TAX, type TaxPack } from '../../src/tax/pack';
import {
  COMPANY_PROFILE_PARTS,
  type CompanyProfileFacts,
  companyProfileSave,
  companyProfileStanding,
  standingMark,
} from '../../src/tenancy/company-profile';

const WELL_FORMED = '27AAACH7409R1ZV';
const ONE_SHORT = '27AAACH7409R1Z';
const NO_REGISTRATION_TYPE: TaxPack = { ...IN_TAX, registrationTypes: [] };
/** A market with a second registration type, to judge two fields at once. */
const TWO_TYPES: TaxPack = {
  ...IN_TAX,
  registrationTypes: [
    ...IN_TAX.registrationTypes,
    {
      type: 'XX_SECOND',
      pattern: '^[0-9]{4}$',
      capturedAt: 'conversion',
      format: { en: '4 digits' },
    },
  ],
};
const second = (value: string) => ({ registrationType: 'XX_SECOND', value });

/** A company as signup leaves it: the name, the city and the two declarations of the step before. */
const atSignup: CompanyProfileFacts = {
  companyName: 'Suryodaya Solar Solutions Pvt Ltd',
  city: 'Pune',
  address: '',
  postalCode: '',
  registrations: [],
  bank: { bankName: '', accountName: '', accountNumber: '', bankRoutingIdentifier: '' },
  segment: 'residential',
  typicalSystemKwp: 5,
};

const fourBankFacts = {
  bankName: 'HDFC Bank',
  accountName: 'Suryodaya Solar Solutions Pvt Ltd',
  accountNumber: '50200012344821',
  bankRoutingIdentifier: 'HDFC0001234',
};

const gst = (value: string) => [{ registrationType: 'IN_GST', value }];

describe('companyProfileStanding — where each part stands when shut (SCR-M01-05)', () => {
  it('a new company stands as signup left it', () => {
    expect(
      COMPANY_PROFILE_PARTS.map((part) => companyProfileStanding(part, atSignup, IN_TAX)),
    ).toEqual(['name_only', 'city_only', 'not_added', 'not_added', 'answered']);
  });

  it.each([
    [{ address: 'Plot 14, Baner Road' }, 'added'],
    [{ address: 'Plot 14, Baner Road', postalCode: '411045' }, 'added'],
    [{ postalCode: '411045' }, 'city_only'],
    [{ address: '   ' }, 'city_only'],
  ] as const)('the address %o stands %s', (typed, standing) => {
    expect(companyProfileStanding('address', { ...atSignup, ...typed }, IN_TAX)).toBe(standing);
  });

  it.each([
    [[], IN_TAX, 'not_added'],
    [gst(''), IN_TAX, 'not_added'],
    [gst('  '), IN_TAX, 'not_added'],
    [gst(ONE_SHORT), IN_TAX, 'check_format'],
    [gst(WELL_FORMED), IN_TAX, 'added'],
    [gst(` ${WELL_FORMED} `), IN_TAX, 'added'],
    [gst(WELL_FORMED), NO_REGISTRATION_TYPE, 'not_added'],
    [[{ registrationType: 'XX_VAT', value: 'anything' }], IN_TAX, 'not_added'],
    [gst('27aaach7409r1zv'), IN_TAX, 'check_format'],
    [gst('27AAACH 7409R1ZV'), IN_TAX, 'check_format'],
    [[...gst(WELL_FORMED), second('12')], TWO_TYPES, 'check_format'],
    [[...gst(WELL_FORMED), second('1234')], TWO_TYPES, 'added'],
    [[...gst(''), second('1234')], TWO_TYPES, 'added'],
  ] as const)(
    'the tax part holding %o stands by the pack’s format',
    (registrations, pack, standing) => {
      expect(companyProfileStanding('tax', { ...atSignup, registrations }, pack)).toBe(standing);
    },
  );

  it.each([
    [fourBankFacts, 'added'],
    [{ ...fourBankFacts, bankRoutingIdentifier: '' }, 'not_added'],
    [{ ...fourBankFacts, bankName: '  ' }, 'not_added'],
    [{ ...atSignup.bank, accountName: atSignup.companyName }, 'not_added'],
  ] as const)('bank details %o stand %s: all four facts or none', (bank, standing) => {
    expect(companyProfileStanding('bank', { ...atSignup, bank }, IN_TAX)).toBe(standing);
  });

  it.each([
    [{ segment: null }, 'not_declared'],
    [{ typicalSystemKwp: null }, 'not_declared'],
    [{ typicalSystemKwp: 0 }, 'not_declared'],
    [{}, 'answered'],
  ] as const)('what you sell with %o stands %s', (declared, standing) => {
    expect(companyProfileStanding('declarations', { ...atSignup, ...declared }, IN_TAX)).toBe(
      standing,
    );
  });

  it.each([
    ['added', 'met'],
    ['answered', 'met'],
    ['name_only', 'open'],
    ['city_only', 'open'],
    ['not_added', 'open'],
    ['not_declared', 'owed'],
    ['check_format', 'owed'],
  ] as const)('%s is marked %s', (standing, mark) => {
    expect(standingMark(standing)).toBe(mark);
  });
});

describe('companyProfileSave — what the act writes (M01-24, M01-25)', () => {
  it('with nothing added it writes the profile as signup left it, no registration, and the step skipped', () => {
    expect(companyProfileSave(atSignup, IN_TAX)).toEqual({
      profile: {
        companyName: 'Suryodaya Solar Solutions Pvt Ltd',
        city: 'Pune',
        segment: 'residential',
        typicalSystemKwp: 5,
        address: null,
        postalCode: null,
        bankDetails: null,
      },
      registrations: [],
      step: 'skipped',
    });
  });

  it.each([
    [{ address: ' Plot 14, Baner Road ' }, { address: 'Plot 14, Baner Road' }],
    [{ postalCode: ' 411045 ' }, { postalCode: '411045' }],
    [{ bank: { ...fourBankFacts, bankName: ' HDFC Bank ' } }, { bankDetails: fourBankFacts }],
  ])('a fact of its own, %o, is written trimmed and completes the step', (typed, written) => {
    const save = companyProfileSave({ ...atSignup, ...typed }, IN_TAX);
    expect(save.profile).toMatchObject(written);
    expect(save.step).toBe('completed');
  });

  it('a well-formed registration is written trimmed and completes the step', () => {
    const save = companyProfileSave(
      { ...atSignup, registrations: gst(` ${WELL_FORMED} `) },
      IN_TAX,
    );
    expect(save.registrations).toEqual(gst(WELL_FORMED));
    expect(save.step).toBe('completed');
  });

  it('a malformed registration is left out and stops nothing: the rest is written and the step recorded', () => {
    const save = companyProfileSave(
      { ...atSignup, address: 'Plot 14, Baner Road', registrations: gst(ONE_SHORT) },
      IN_TAX,
    );
    expect(save.registrations).toEqual([]);
    expect(save.profile.address).toBe('Plot 14, Baner Road');
    expect(save.step).toBe('completed');
  });

  it('a malformed registration alone leaves the step skipped', () => {
    const save = companyProfileSave({ ...atSignup, registrations: gst(ONE_SHORT) }, IN_TAX);
    expect(save).toMatchObject({ registrations: [], step: 'skipped' });
  });

  it.each([
    [{ ...fourBankFacts, accountNumber: '' }],
    [{ ...atSignup.bank, accountName: atSignup.companyName }],
  ])('bank details short of four facts, %o, are not written and complete nothing', (bank) => {
    const save = companyProfileSave({ ...atSignup, bank }, IN_TAX);
    expect(save.profile.bankDetails).toBeNull();
    expect(save.step).toBe('skipped');
  });

  it('with two types, the well-formed one is written and the malformed one left out', () => {
    const registrations = [...gst(WELL_FORMED), second('12')];
    const save = companyProfileSave({ ...atSignup, registrations }, TWO_TYPES);
    expect(save).toMatchObject({ registrations: gst(WELL_FORMED), step: 'completed' });
  });

  it('a type typed twice is written once, the first as typed', () => {
    const registrations = [...gst(WELL_FORMED), ...gst('29AAACH7409R1ZV')];
    expect(companyProfileSave({ ...atSignup, registrations }, IN_TAX).registrations).toEqual(
      gst(WELL_FORMED),
    );
  });

  it.each([0, -1, 1_000_000])('a size of %s is no declaration and is written as none', (kwp) => {
    const save = companyProfileSave({ ...atSignup, typicalSystemKwp: kwp }, IN_TAX);
    expect(save.profile.typicalSystemKwp).toBeNull();
  });

  it('a registration of a type the market never declared is not written', () => {
    const registrations = [{ registrationType: 'XX_VAT', value: 'anything' }];
    expect(companyProfileSave({ ...atSignup, registrations }, IN_TAX).registrations).toEqual([]);
  });

  it('the name and the city are written trimmed, the declarations as held', () => {
    const save = companyProfileSave(
      {
        ...atSignup,
        companyName: ' Suryodaya ',
        city: ' Pune ',
        segment: null,
        typicalSystemKwp: null,
      },
      IN_TAX,
    );
    expect(save.profile).toMatchObject({
      companyName: 'Suryodaya',
      city: 'Pune',
      segment: null,
      typicalSystemKwp: null,
    });
  });
});
