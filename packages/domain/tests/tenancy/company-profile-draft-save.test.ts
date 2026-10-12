import { describe, expect, it } from 'vitest';
import { IN_TAX } from '../../src/tax/pack';
import {
  companyProfileSaveOf,
  companyProfileValuesAtRead,
  registrationsChanged,
} from '../../src/tenancy/company-profile-draft';
import {
  atSignup,
  COMPANY,
  gst,
  NO_REGISTRATION_TYPE,
  other,
  TWO_TYPES,
  WELL_FORMED,
} from './company-profile-stored';

describe('companyProfileSaveOf — what the act sends for what is typed', () => {
  const values = companyProfileValuesAtRead(atSignup, IN_TAX);

  it.each([
    ['emptied', ''],
    ['left as spaces', '   '],
  ])('a name %s is sent as it was read', (_name, typed) => {
    const save = companyProfileSaveOf({ ...values, companyName: typed }, atSignup, IN_TAX);
    expect(save.profile.companyName).toBe(COMPANY);
  });

  it('an emptied city is sent as it was read', () => {
    const save = companyProfileSaveOf({ ...values, city: '' }, atSignup, IN_TAX);
    expect(save.profile.city).toBe('Pune');
  });

  it('a changed name and city are sent as typed', () => {
    const save = companyProfileSaveOf(
      { ...values, companyName: ' Suryodaya Solar ', city: 'Nashik' },
      atSignup,
      IN_TAX,
    );
    expect(save.profile).toMatchObject({ companyName: 'Suryodaya Solar', city: 'Nashik' });
  });

  it('a renamed company leaves the holder it never touched as no bank fact', () => {
    const save = companyProfileSaveOf(
      { ...values, companyName: 'Suryodaya Solar' },
      atSignup,
      IN_TAX,
    );
    expect(save).toMatchObject({ profile: { bankDetailsTyped: null }, step: 'skipped' });
  });

  it('the read name as holder beside another bank fact is a bank fact', () => {
    const typed = { ...values, companyName: 'Suryodaya Solar', bankName: 'HDFC Bank' };
    const save = companyProfileSaveOf(typed, atSignup, IN_TAX);
    expect(save.profile.bankDetailsTyped).toMatchObject({
      bankName: 'HDFC Bank',
      accountName: COMPANY,
    });
  });

  it('the holder that still holds the read name, beside an emptied name, is no bank fact', () => {
    const save = companyProfileSaveOf({ ...values, companyName: '' }, atSignup, IN_TAX);
    expect(save.profile.bankDetailsTyped).toBeNull();
    expect(save.step).toBe('skipped');
  });
});

describe('companyProfileSaveOf — the registrations it sends', () => {
  const values = companyProfileValuesAtRead(atSignup, IN_TAX);
  const withStored = { ...atSignup, registrations: [gst(WELL_FORMED), other] };

  it('a stored registration of a second declared type goes back beside the one typed', () => {
    const typed = { ...values, taxRegistration: '27AAACH7409R1ZW' };
    const save = companyProfileSaveOf(typed, { ...atSignup, registrations: [other] }, TWO_TYPES);
    expect(save.registrations).toEqual([gst('27AAACH7409R1ZW'), other]);
  });

  it('a number typed malformed over a stored one takes nothing away, and the stored one still completes the step', () => {
    const typed = { ...values, taxRegistration: '27AAACH7409R1Z' };
    const save = companyProfileSaveOf(typed, withStored, TWO_TYPES);
    expect(registrationsChanged(withStored.registrations, save.registrations)).toBe(false);
    expect(save.step).toBe('completed');
  });

  it('a number typed malformed with none stored writes none and completes nothing', () => {
    const typed = { ...values, taxRegistration: '27AAACH7409R1Z' };
    expect(companyProfileSaveOf(typed, atSignup, IN_TAX)).toMatchObject({
      registrations: [],
      step: 'skipped',
    });
  });

  it('a market that declares no type leaves what is stored as it is', () => {
    const stored = { ...atSignup, registrations: [gst(WELL_FORMED)] };
    const save = companyProfileSaveOf(values, stored, NO_REGISTRATION_TYPE);
    expect(registrationsChanged(stored.registrations, save.registrations)).toBe(false);
  });

  it('a stored number the owner empties is taken out', () => {
    const save = companyProfileSaveOf({ ...values, taxRegistration: '' }, withStored, TWO_TYPES);
    expect(save.registrations).toEqual([other]);
  });
});

describe('registrationsChanged — whether the registrations are written', () => {
  it.each([
    ['the same list', [gst(WELL_FORMED), other], [gst(WELL_FORMED), other], false],
    ['the same list in another order', [gst(WELL_FORMED), other], [other, gst(WELL_FORMED)], false],
    ['two empty lists', [], [], false],
    ['a changed value', [gst(WELL_FORMED)], [gst('27AAACH7409R1ZW')], true],
    ['one added', [], [gst(WELL_FORMED)], true],
    ['one taken out', [gst(WELL_FORMED)], [], true],
  ] as const)('%s → %s', (_name, stored, next, changed) => {
    expect(registrationsChanged(stored, next)).toBe(changed);
  });
});
