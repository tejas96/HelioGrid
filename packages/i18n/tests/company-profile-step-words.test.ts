import { COMPANY_LOGO_LIMITS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { COMPANY_LOGO, companyLogoCapture } from '../src/copy/company-logo';
import { COMPANY_PROFILE } from '../src/copy/company-profile';
import { companyProfileStepWords } from '../src/copy/company-profile-step-words';
import { createTranslator } from '../src/runtime';
import { AT_SIGNUP } from './company-profile-facts';

const LABELS = { taxIdLabel: 'GSTIN', bankRoutingLabel: 'IFSC' };
const LOGO = { limits: COMPANY_LOGO_LIMITS, refusal: null, held: false };
const STEP = {
  life: 'setup',
  status: 'ready',
  arrivedUndeclared: false,
  standings: AT_SIGNUP.standings,
  open: AT_SIGNUP.open,
  values: { city: 'Pune' },
  letterhead: AT_SIGNUP.letterhead,
  taxFormat: { en: '15 characters', hi: '15 अक्षर' },
  logo: LOGO,
} as const;

describe('companyProfileStepWords — the setup step’s words', () => {
  it.each([
    ['en', '15 characters'],
    ['hi', '15 अक्षर'],
    ['mr', '15 characters'],
  ] as const)(
    'the format line reads in %s, English where the pack has no words',
    async (reader, format) => {
      const { t } = await createTranslator(reader);
      expect(companyProfileStepWords(t, reader, STEP, LABELS).tax.format).toBe(format);
    },
  );

  it('a market with no registration type has no format line', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileStepWords(t, 'en', { ...STEP, taxFormat: null }, LABELS);
    expect(words.tax.format).toBe('');
  });

  it('never reads as a step skipped, and carries the two labels', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileStepWords(t, 'en', STEP, LABELS);
    expect(words.lede).toBe(t(COMPANY_PROFILE.lede));
    expect(words.bank.routing).toBe('IFSC');
    expect(words.tax.label).toBe(t(COMPANY_PROFILE.optional, { label: 'GSTIN' }));
  });

  it.each(['en', 'hi', 'mr'] as const)(
    'hands the capture area the logo’s facts in %s',
    async (reader) => {
      const { t } = await createTranslator(reader);
      const refused = {
        ...LOGO,
        refusal: { missed: ['width'], megabytes: 0.4, widthPx: 320 },
      } as const;
      expect(companyProfileStepWords(t, reader, { ...STEP, logo: refused }, LABELS).logo).toEqual(
        companyLogoCapture(t, refused),
      );
    },
  );

  it('a held logo reads as held', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileStepWords(
      t,
      'en',
      { ...STEP, logo: { ...LOGO, held: true } },
      LABELS,
    );
    expect(words.logo).toMatchObject({ held: true, name: t(COMPANY_LOGO.held) });
  });
});
