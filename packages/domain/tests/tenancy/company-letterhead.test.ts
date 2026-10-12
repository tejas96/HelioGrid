import { describe, expect, it } from 'vitest';
import { IN_TAX, type TaxPack } from '../../src/tax/pack';
import { type CompanyProfileFacts, companyLetterhead } from '../../src/tenancy/company-profile';

const [GST] = IN_TAX.registrationTypes;
const gst = (value: string) => ({ registrationType: GST?.type ?? '', value });
const NO_REGISTRATION_TYPE: TaxPack = { ...IN_TAX, registrationTypes: [] };

const NO_BANK = { bankName: '', accountName: '', accountNumber: '', bankRoutingIdentifier: '' };
const BANK = {
  bankName: 'HDFC Bank',
  accountName: 'Suryodaya Solar Solutions Pvt Ltd',
  accountNumber: '50100234564821',
  bankRoutingIdentifier: 'HDFC0001234',
};

/** A company as signup leaves it: the name and the city, nothing added. */
const atSignup: CompanyProfileFacts = {
  companyName: 'Suryodaya Solar Solutions Pvt Ltd',
  city: 'Pune',
  address: '',
  postalCode: '',
  registrations: [],
  bank: NO_BANK,
  segment: 'residential',
  typicalSystemKwp: 5,
};

describe('the letterhead a company profile builds', () => {
  it('shows a new company its name and its city, and nothing it has not added', () => {
    expect(companyLetterhead(atSignup, IN_TAX)).toEqual({
      companyName: 'Suryodaya Solar Solutions Pvt Ltd',
      addressLine: 'Pune',
      registration: null,
      bank: null,
    });
  });

  it.each([
    [
      'the street, the city and the PIN code',
      'Plot 14, Baner Road',
      'Pune',
      '411045',
      'Plot 14, Baner Road, Pune 411045',
    ],
    ['no street', '', 'Pune', '411045', 'Pune 411045'],
    ['no PIN code', 'Plot 14, Baner Road', 'Pune', '', 'Plot 14, Baner Road, Pune'],
    ['a street alone', 'Plot 14, Baner Road', '', '', 'Plot 14, Baner Road'],
    ['a PIN code alone', '', '', '411045', '411045'],
    ['spaces alone', '  ', ' ', '\t', ''],
    ['spaces around each', ' Plot 14 ', ' Pune ', ' 411045 ', 'Plot 14, Pune 411045'],
  ])('joins the address as one line: %s', (_case, address, city, postalCode, line) => {
    const facts = { ...atSignup, address, city, postalCode };
    expect(companyLetterhead(facts, IN_TAX).addressLine).toBe(line);
  });

  it('shows the name as typed, without the spaces around it', () => {
    expect(companyLetterhead({ ...atSignup, companyName: '  Surya  ' }, IN_TAX).companyName).toBe(
      'Surya',
    );
  });

  it.each([
    ['nothing typed', [gst('')], IN_TAX, null],
    ['spaces alone', [gst('   ')], IN_TAX, null],
    [
      'one that reads as the format',
      [gst(' 27AAACH7409R1ZV ')],
      IN_TAX,
      { value: '27AAACH7409R1ZV', wellFormed: true },
    ],
    [
      'one character short',
      [gst('27AAACH7409R1Z')],
      IN_TAX,
      { value: '27AAACH7409R1Z', wellFormed: false },
    ],
    ['a type the market does not declare', [gst('27AAACH7409R1ZV')], NO_REGISTRATION_TYPE, null],
    [
      'an empty field before a typed one',
      [gst(''), gst('27AAACH7409R1Z')],
      IN_TAX,
      { value: '27AAACH7409R1Z', wellFormed: false },
    ],
  ])(
    'shows the registration as typed, and says whether it reads well: %s',
    (_case, registrations, pack, shown) => {
      expect(companyLetterhead({ ...atSignup, registrations }, pack).registration).toEqual(shown);
    },
  );

  it.each([
    ['all four facts', BANK, { bankName: 'HDFC Bank', accountEnding: '4821' }],
    ['no bank name', { ...BANK, bankName: '' }, null],
    ['no account holder', { ...BANK, accountName: ' ' }, null],
    ['no account number', { ...BANK, accountNumber: '' }, null],
    ['no routing identifier', { ...BANK, bankRoutingIdentifier: '' }, null],
    ['the holder alone, as the screen opens', { ...NO_BANK, accountName: 'Suryodaya Solar' }, null],
  ])('names the bank only once all four facts are held: %s', (_case, bank, shown) => {
    expect(companyLetterhead({ ...atSignup, bank }, IN_TAX).bank).toEqual(shown);
  });

  it.each([
    ['two characters', '21', '21'],
    ['four characters', '4821', '4821'],
    ['five characters', '34821', '4821'],
    ['sixteen characters', '5010023456784821', '4821'],
    ['typed in groups', '5010 0234 5648 21', '4821'],
    ['typed with dashes', '5010-0234-5648-21', '4821'],
    ['ending in letters', '50100234AB21', 'AB21'],
  ])(
    'ends the bank line with the account’s last four characters: %s',
    (_case, accountNumber, ending) => {
      const shown = companyLetterhead({ ...atSignup, bank: { ...BANK, accountNumber } }, IN_TAX);
      expect(shown.bank?.accountEnding).toBe(ending);
    },
  );
});
