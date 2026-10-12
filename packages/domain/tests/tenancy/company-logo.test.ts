import { describe, expect, it } from 'vitest';
import { FILE_SUBJECT_RULES } from '../../src/files/rules';
import { IN_TAX } from '../../src/tax/pack';
import {
  COMPANY_LOGO_LIMITS,
  type CompanyLogoLimits,
  companyLogoRefusal,
  megabytesShown,
} from '../../src/tenancy/company-logo';
import {
  companyProfileSave,
  companyProfileStanding,
  standingMark,
} from '../../src/tenancy/company-profile';
import { factsAtSignup } from './company-profile-stored';

const LOGO = '0190a1b2-0000-7000-8000-000000000001';

describe('COMPANY_LOGO_LIMITS — one statement of what a logo may be', () => {
  it('states the type and the size the api refuses by, and the width the device checks', () => {
    expect(COMPANY_LOGO_LIMITS).toEqual({
      contentTypes: FILE_SUBJECT_RULES.tenant.contentTypes,
      maxBytes: FILE_SUBJECT_RULES.tenant.maxBytes,
      minWidthPx: 400,
    });
  });
});

describe('companyLogoRefusal — every limit a chosen image misses', () => {
  const png = { contentType: 'image/png', byteSize: 2_000_000, widthPx: 400 };

  it.each([
    ['a PNG at the size and the width exactly', png],
    ['a small JPG', { contentType: 'image/jpeg', byteSize: 1, widthPx: 4_000 }],
  ])('%s is taken', (_name, image) => {
    expect(companyLogoRefusal(image, COMPANY_LOGO_LIMITS)).toBeNull();
  });

  it.each([
    ['one byte over', { ...png, byteSize: 2_000_001 }, ['size']],
    ['one pixel under', { ...png, widthPx: 399 }, ['width']],
    ['over and under', { ...png, byteSize: 3_400_000, widthPx: 320 }, ['size', 'width']],
    ['a GIF inside both', { ...png, contentType: 'image/gif' }, ['type']],
    ['a GIF outside both', { contentType: 'image/gif', byteSize: 9e6, widthPx: 1 }, ['type']],
    ['a PNG no device can measure', { ...png, widthPx: null }, ['type']],
    ['a PNG of no width', { ...png, widthPx: 0 }, ['width']],
  ])('%s misses %j', (_name, image, missed) => {
    expect(companyLogoRefusal(image, COMPANY_LOGO_LIMITS)?.missed).toEqual(missed);
  });

  it('carries the size and the width a refusal prints', () => {
    const refusal = companyLogoRefusal(
      { ...png, byteSize: 3_400_000, widthPx: 320 },
      COMPANY_LOGO_LIMITS,
    );
    expect(refusal).toEqual({ missed: ['size', 'width'], megabytes: 3.4, widthPx: 320 });
  });

  it('judges by the limits it is handed', () => {
    const wide: CompanyLogoLimits = {
      ...COMPANY_LOGO_LIMITS,
      maxBytes: 5_000_000,
      minWidthPx: 600,
    };
    expect(companyLogoRefusal({ ...png, byteSize: 5_000_000, widthPx: 600 }, wide)).toBeNull();
    expect(companyLogoRefusal({ ...png, byteSize: 5_000_001 }, wide)?.missed).toEqual([
      'size',
      'width',
    ]);
  });
});

describe('megabytesShown — a size as a line prints it', () => {
  it.each([
    [2_000_000, 2],
    [2_000_001, 2.1],
    [2_100_000, 2.1],
    [3_400_000, 3.4],
    [1, 0.1],
    [0, 0],
  ])('%d bytes read %d MB, never under what they are', (bytes, megabytes) => {
    expect(megabytesShown(bytes)).toBe(megabytes);
  });
});

describe('the logo on the profile — the first part and the step', () => {
  const atSignup = factsAtSignup;

  it.each([
    ['no logo', 'name_only', 'open', null],
    ['a logo', 'added', 'met', LOGO],
  ] as const)('with %s the first part stands %s', (_name, standing, mark, logoFileId) => {
    const stands = companyProfileStanding('identity', { ...atSignup, logoFileId }, IN_TAX);
    expect(stands).toBe(standing);
    expect(standingMark(stands)).toBe(mark);
  });

  it.each([
    ['no logo and nothing typed', 'skipped', null],
    ['a logo and nothing typed', 'completed', LOGO],
  ] as const)('%s records the step %s', (_name, step, logoFileId) => {
    expect(companyProfileSave({ ...atSignup, logoFileId }, IN_TAX).step).toBe(step);
  });
});
