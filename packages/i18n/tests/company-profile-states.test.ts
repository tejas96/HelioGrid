import { describe, expect, it } from 'vitest';
import { COMPANY_PROFILE } from '../src/copy/company-profile';
import { companyProfileWords } from '../src/copy/company-profile-words';
import { createTranslator, packWords } from '../src/runtime';
import { AT_SIGNUP, standing } from './company-profile-facts';

const LEDE = 'On every proposal, invoice and customer link · asked for once';

/** What the company profile's words say as its state changes (`SCR-M01-05`), read in English. */
describe('companyProfileWords, by state', () => {
  it('the tax label, the bank code’s label and the format line are the pack’s, never this module’s', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileWords(t, {
      ...standing('tax', 'check_format'),
      taxIdLabel: 'VAT no.',
      taxFormat: packWords({ en: '9 digits · like 123456789' }, 'en'),
      bankRoutingLabel: packWords({ en: 'Sort code' }, 'en'),
    });
    expect(words.tax).toMatchObject({
      label: 'VAT no. (optional)',
      format: '9 digits · like 123456789',
      error: '9 digits · like 123456789',
    });
    expect(words.bank.routing).toBe('Sort code');
    expect(words.letterhead.taxLabel).toBe('VAT no.');
    expect(JSON.stringify(words)).not.toMatch(/GSTIN|IFSC/);
  });

  it.each([
    ['added', 'Added', 'met'],
    ['not_declared', 'Not declared', 'owed'],
    ['check_format', 'Check the format', 'owed'],
  ] as const)('a part standing %s reads %s, marked %s', async (word, standingWord, mark) => {
    const { t } = await createTranslator('en');
    const [, , tax] = companyProfileWords(t, standing('tax', word)).parts;
    expect(tax).toMatchObject({ standing: standingWord, mark });
  });

  it('a malformed registration is answered with the format line; a well-formed one with nothing', async () => {
    const { t } = await createTranslator('en');
    expect(companyProfileWords(t, standing('tax', 'check_format')).tax.error).toBe(
      AT_SIGNUP.taxFormat,
    );
    expect(companyProfileWords(t, standing('tax', 'added')).tax.error).toBeNull();
  });

  it('while the record loads the region has a name and the act says why it waits', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileWords(t, { ...AT_SIGNUP, read: 'loading' });
    expect(words.loading).toBe('Loading your company profile');
    expect(words.act).toMatchObject({
      primary: 'Save and continue',
      waiting: 'Profile still loading',
    });
  });

  it('a profile that could not be read says so, with a retry and a way on', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileWords(t, { ...AT_SIGNUP, read: 'failed' });
    expect(words.act).toBeNull();
    expect(words.unread).toEqual({
      title: "We couldn't load your profile",
      line: 'Our end, not yours · nothing is lost',
      retry: 'Try again',
      onward: 'Continue without it',
      onwardSpoken: 'Continue setting up HelioGrid without your company profile',
    });
  });

  it('a failed save is said once at the act, the retry first and the way on second, with no other line', async () => {
    const { t } = await createTranslator('en');
    const facts = { ...AT_SIGNUP, saveFailed: true, open: 'declarations' } as const;
    expect(companyProfileWords(t, facts).act).toEqual({
      primary: 'Try again',
      primarySpoken: 'Try saving your company profile again',
      waiting: null,
      secondary: 'Continue without it',
      secondarySpoken: 'Continue setting up HelioGrid without saving your company profile',
      alert: 'Not saved · our end · nothing typed is lost',
      line: null,
    });
  });

  it.each([
    [{ skipped: true }, 'Skipped during setup · your first proposal needs it', null],
    [{ open: 'declarations' }, LEDE, 'Only new proposals reprice · sent ones keep theirs'],
    [{ open: 'bank' }, LEDE, null],
    [{ open: null }, LEDE, null],
  ] as const)('with %o the lede and the line at the act follow', async (facts, lede, line) => {
    const { t } = await createTranslator('en');
    const words = companyProfileWords(t, { ...AT_SIGNUP, ...facts });
    expect(words.lede).toBe(lede);
    expect(words.act?.line).toBe(line);
  });

  it.each([{ skipped: false }, { skipped: true }, { open: 'declarations' as const }])(
    'an undeclared answer names the failed save and its cost, whatever else is true (%o)',
    async (facts) => {
      const { t } = await createTranslator('en');
      const words = companyProfileWords(t, {
        ...standing('declarations', 'not_declared'),
        arrivedUndeclared: true,
        ...facts,
      });
      expect(words.lede).toBe('What you sell · not saved on the last step');
      expect(words.act?.line).toBe('Market defaults until you set these');
    },
  );

  it.each(['en', 'hi', 'mr'] as const)(
    'an answer taken out on this screen keeps the lede and states its cost (%s)',
    async (reader) => {
      const { t } = await createTranslator(reader);
      const words = companyProfileWords(t, standing('declarations', 'not_declared'));
      expect(words.lede).toBe(t(COMPANY_PROFILE.lede));
      expect(words.act?.line).toBe(t(COMPANY_PROFILE.marketDefaults));
    },
  );

  it('answers that arrived missing and were given here no longer name the step before', async () => {
    const { t } = await createTranslator('en');
    const words = companyProfileWords(t, { ...AT_SIGNUP, arrivedUndeclared: true });
    expect(words.lede).toBe(LEDE);
  });

  it.each([
    ['loading', { read: 'loading' }],
    ['unread', { read: 'failed' }],
    ['save-failed', { saveFailed: true }],
  ] as const)(
    'while the profile is %s nothing is said to be missing, whatever the parts hold',
    async (_state, state) => {
      const { t } = await createTranslator('en');
      const words = companyProfileWords(t, {
        ...standing('declarations', 'not_declared'),
        arrivedUndeclared: true,
        ...state,
        skipped: true,
        open: 'declarations',
      });
      expect(words.lede).toBe(LEDE);
      expect(words.act?.line ?? null).toBeNull();
    },
  );

  it.each(['loading', 'failed'] as const)(
    'while the profile is %s the letterhead shows nothing of it',
    async (read) => {
      const { t } = await createTranslator('en');
      const { letterhead } = companyProfileWords(t, { ...AT_SIGNUP, read });
      expect(letterhead).toMatchObject({ name: '', address: '', tax: null, bankLine: null });
    },
  );

  it('a failed save keeps the letterhead as the fields hold it', async () => {
    const { t } = await createTranslator('en');
    const { letterhead } = companyProfileWords(t, { ...AT_SIGNUP, saveFailed: true });
    expect(letterhead).toMatchObject({
      name: 'Suryodaya Solar Solutions Pvt Ltd',
      address: 'Pune',
    });
  });
});
