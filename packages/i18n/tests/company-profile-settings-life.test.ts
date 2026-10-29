import { describe, expect, it } from 'vitest';
import { COMPANY_PROFILE } from '../src/copy/company-profile';
import { companyProfileWords } from '../src/copy/company-profile-words';
import { backToSettings, settingsRowName } from '../src/copy/settings';
import { createTranslator } from '../src/runtime';
import { AT_SIGNUP, standing } from './company-profile-facts';

const IN_SETTINGS = { ...AT_SIGNUP, life: 'settings' } as const;

describe('companyProfileWords — the settings life (`m-settings`, `d-settings`)', () => {
  it.each(['en', 'hi', 'mr'] as const)(
    'is titled by the row that opens it, in %s',
    async (reader) => {
      const { t } = await createTranslator(reader);
      expect(companyProfileWords(t, IN_SETTINGS).title).toBe(settingsRowName(t, 'company_profile'));
    },
  );

  it.each([
    ['a profile read whole', IN_SETTINGS],
    [
      'a profile read without the step before’s answers',
      {
        ...standing('declarations', 'not_declared'),
        arrivedUndeclared: true,
        life: 'settings',
      },
    ],
    ['a skipped step', { ...IN_SETTINGS, skipped: true }],
  ] as const)('keeps the settings lede for %s', async (_, facts) => {
    const { t } = await createTranslator('en');
    expect(companyProfileWords(t, facts).lede).toBe(t(COMPANY_PROFILE.settingsLede));
  });

  it('saves changes, and names what it saves', async () => {
    const { t } = await createTranslator('en');
    const { act } = companyProfileWords(t, IN_SETTINGS);
    expect([act?.primary, act?.primarySpoken, act?.secondary]).toEqual([
      t(COMPANY_PROFILE.saveChanges),
      t(COMPANY_PROFILE.saveChangesSpoken),
      null,
    ]);
  });

  it('after a failed save says so at the same act, with no way on without it', async () => {
    const { t } = await createTranslator('en');
    const { act } = companyProfileWords(t, { ...IN_SETTINGS, saveFailed: true });
    expect([act?.primary, act?.alert, act?.secondary, act?.secondarySpoken]).toEqual([
      t(COMPANY_PROFILE.saveChanges),
      t(COMPANY_PROFILE.notSaved),
      null,
      null,
    ]);
  });

  it('after a failed read offers the retry alone', async () => {
    const { t } = await createTranslator('en');
    const { unread } = companyProfileWords(t, { ...IN_SETTINGS, read: 'failed' });
    expect([unread?.onward, unread?.onwardSpoken]).toEqual([null, null]);
    expect(companyProfileWords(t, { ...AT_SIGNUP, read: 'failed' }).unread?.onward).toBe(
      t(COMPANY_PROFILE.onward),
    );
  });

  it.each([
    ['declarations', true],
    ['bank', false],
  ] as const)('with %s open shows the re-seed line: %s', async (open, shown) => {
    const { t } = await createTranslator('en');
    expect(companyProfileWords(t, { ...IN_SETTINGS, open }).act?.line).toBe(
      shown ? t(COMPANY_PROFILE.reseedScope) : null,
    );
  });

  it.each(['en', 'hi', 'mr'] as const)('names the way back to the list in %s', async (reader) => {
    const { t } = await createTranslator(reader);
    expect(backToSettings(t)).not.toBe('');
    expect(backToSettings(t)).not.toBe(settingsRowName(t, 'company_profile'));
  });
});
