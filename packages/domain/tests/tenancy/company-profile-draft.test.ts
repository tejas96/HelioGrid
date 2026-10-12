import { describe, expect, it } from 'vitest';
import { IN_TAX } from '../../src/tax/pack';
import {
  COMPANY_PROFILE_FIELD_CAP,
  companyProfileEdited,
  companyProfileFacts,
  companyProfileOpenAtRead,
  companyProfileValuesAtRead,
  companyProfileView,
} from '../../src/tenancy/company-profile-draft';
import {
  atSignup,
  bankNameAlone,
  COMPANY,
  fourBankFacts,
  gst,
  NO_REGISTRATION_TYPE,
  other,
  storing,
  WELL_FORMED,
} from './company-profile-stored';

describe('companyProfileValuesAtRead — what the fields hold when the screen opens (SCR-M01-05)', () => {
  it('a new company: the name and the city read back, the holder holding the company name', () => {
    expect(companyProfileValuesAtRead(atSignup, IN_TAX)).toEqual({
      companyName: COMPANY,
      city: 'Pune',
      address: '',
      postalCode: '',
      taxRegistration: '',
      bankName: '',
      accountName: COMPANY,
      accountNumber: '',
      bankRoutingIdentifier: '',
      segment: 'residential',
      typicalSystemKwp: 5,
    });
  });

  it('a stored address and PIN code fill their fields', () => {
    const values = companyProfileValuesAtRead(
      storing({ address: 'Plot 14, Baner Road', postalCode: '411045' }),
      IN_TAX,
    );
    expect(values).toMatchObject({ address: 'Plot 14, Baner Road', postalCode: '411045' });
  });

  it('whole bank details fill the four fields', () => {
    const values = companyProfileValuesAtRead(storing({ bankDetails: fourBankFacts }), IN_TAX);
    expect(values).toMatchObject(fourBankFacts);
  });

  it('a stored half fills what it holds, and the holder it never held stays empty', () => {
    const values = companyProfileValuesAtRead(storing({ bankDetailsTyped: bankNameAlone }), IN_TAX);
    expect(values).toMatchObject({
      bankName: 'HDFC Bank',
      accountName: '',
      accountNumber: '',
      bankRoutingIdentifier: '',
    });
  });

  it('whole details beside a half are read alone', () => {
    const stored = storing({ bankDetails: fourBankFacts, bankDetailsTyped: bankNameAlone });
    expect(companyProfileValuesAtRead(stored, IN_TAX)).toMatchObject(fourBankFacts);
  });

  it('an api that answers no half reads as none', () => {
    const { bankDetailsTyped: _never, ...profile } = atSignup.profile;
    const values = companyProfileValuesAtRead({ profile, registrations: [] }, IN_TAX);
    expect(values.accountName).toBe(COMPANY);
  });

  it.each([
    [
      'the stored registration of the market’s type',
      [other, gst(WELL_FORMED)],
      IN_TAX,
      WELL_FORMED,
    ],
    ['nothing when none of that type is stored', [other], IN_TAX, ''],
    ['nothing in a market that declares no type', [gst(WELL_FORMED)], NO_REGISTRATION_TYPE, ''],
  ] as const)('the tax field holds %s', (_name, registrations, tax, held) => {
    const values = companyProfileValuesAtRead({ ...atSignup, registrations }, tax);
    expect(values.taxRegistration).toBe(held);
  });
});

describe('companyProfileOpenAtRead — the part that is open on arrival', () => {
  it('the first part, when nothing is owed', () => {
    expect(companyProfileOpenAtRead(atSignup, IN_TAX)).toBe('identity');
  });

  it.each([[{ segment: null }], [{ typicalSystemKwp: null }], [{ typicalSystemKwp: 0 }]] as const)(
    'what you sell, when %o was read',
    (undeclared) => {
      expect(companyProfileOpenAtRead(storing(undeclared), IN_TAX)).toBe('declarations');
    },
  );
});

describe('companyProfileEdited — one keystroke', () => {
  const values = companyProfileValuesAtRead(atSignup, IN_TAX);

  it('replaces the one field and leaves the rest', () => {
    expect(companyProfileEdited(values, 'address', 'Plot 14')).toEqual({
      ...values,
      address: 'Plot 14',
    });
  });

  it('can empty a field', () => {
    expect(companyProfileEdited(values, 'companyName', '').companyName).toBe('');
  });

  it.each(Object.entries(COMPANY_PROFILE_FIELD_CAP))(
    '%s takes no more than its %i characters',
    (field, cap) => {
      const edit = (length: number) =>
        companyProfileEdited(
          values,
          field as keyof typeof COMPANY_PROFILE_FIELD_CAP,
          'x'.repeat(length),
        );
      expect(edit(cap - 1)[field as keyof typeof COMPANY_PROFILE_FIELD_CAP]).toHaveLength(cap - 1);
      expect(edit(cap)[field as keyof typeof COMPANY_PROFILE_FIELD_CAP]).toHaveLength(cap);
      expect(edit(cap + 1)[field as keyof typeof COMPANY_PROFILE_FIELD_CAP]).toHaveLength(cap);
    },
  );
});

describe('companyProfileFacts — the fields as the rules read them', () => {
  const values = companyProfileValuesAtRead(atSignup, IN_TAX);

  it('the tax field is the registration of the market’s type, as typed', () => {
    const facts = companyProfileFacts({ ...values, taxRegistration: 'abc' }, atSignup, IN_TAX);
    expect(facts.registrations).toEqual([gst('abc')]);
  });

  it('a stored registration of a type the screen does not draw is kept', () => {
    const facts = companyProfileFacts(values, { ...atSignup, registrations: [other] }, IN_TAX);
    expect(facts.registrations).toEqual([gst(''), other]);
  });

  it('a market that declares no type draws no field, and what is stored stays', () => {
    const stored = { ...atSignup, registrations: [gst(WELL_FORMED)] };
    const facts = companyProfileFacts(values, stored, NO_REGISTRATION_TYPE);
    expect(facts.registrations).toEqual([gst(WELL_FORMED)]);
  });

  it('the four bank fields are the bank', () => {
    const facts = companyProfileFacts({ ...values, ...fourBankFacts }, atSignup, IN_TAX);
    expect(facts.bank).toEqual(fourBankFacts);
  });
});

describe('companyProfileView — what the screen says about what it holds', () => {
  const values = companyProfileValuesAtRead(atSignup, IN_TAX);

  it('a new company: each part as signup left it, the letterhead its name and city, the market’s format', () => {
    expect(companyProfileView(values, atSignup, IN_TAX)).toEqual({
      standings: {
        identity: 'name_only',
        address: 'city_only',
        tax: 'not_added',
        bank: 'not_added',
        declarations: 'answered',
      },
      letterhead: { companyName: COMPANY, addressLine: 'Pune', registration: null, bank: null },
      taxFormat: IN_TAX.registrationTypes[0]?.format,
    });
  });

  it('a number one character short owes its format, and the letterhead shows it as typed', () => {
    const view = companyProfileView(
      { ...values, taxRegistration: '27AAACH7409R1Z' },
      atSignup,
      IN_TAX,
    );
    expect(view.standings.tax).toBe('check_format');
    expect(view.letterhead.registration).toEqual({ value: '27AAACH7409R1Z', wellFormed: false });
  });

  it('a market that declares no registration type has no format to explain', () => {
    expect(companyProfileView(values, atSignup, NO_REGISTRATION_TYPE).taxFormat).toBeNull();
  });
});
