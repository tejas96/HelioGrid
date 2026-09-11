import { describe, expect, it } from 'vitest';
import { companySignupWords } from '../src/copy/company-signup-frames';
import { createTranslator } from '../src/runtime';

/**
 * The four frames the company step draws (`SCR-M01-02`), in words both platforms say the same
 * way: the normal frame carries an intro, the resumed frame greets, the writing frame names the
 * write, and the refused frame says what was not created.
 */
describe('companySignupWords', () => {
  const normal = { restored: false, writing: false, failed: false };

  it('the normal frame: the title, an intro, the create primary, no caption', async () => {
    const { t } = await createTranslator('en');
    const words = companySignupWords(t, normal);
    expect(words.title).toBe('Your company');
    expect(words.intro).not.toBeNull();
    expect(words.primary).toBe('Create company');
    expect(words.caption).toBeNull();
  });

  it('the resumed frame greets and drops the intro (M01-10)', async () => {
    const { t } = await createTranslator('en');
    const words = companySignupWords(t, { ...normal, restored: true });
    expect(words.title).not.toBe('Your company');
    expect(words.intro).toBeNull();
    expect(words.primary).toBe('Create company');
  });

  it('the writing frame names the write on the primary and under it, with no intro', async () => {
    const { t } = await createTranslator('en');
    const words = companySignupWords(t, { ...normal, writing: true });
    expect(words.title).toBe('Your company');
    expect(words.intro).toBeNull();
    expect(words.primary).toBe('Creating your company');
    expect(words.caption).not.toBeNull();
  });

  it('the refused frame outranks resumed: says what was not created, offers try again', async () => {
    const { t } = await createTranslator('en');
    const words = companySignupWords(t, { restored: true, writing: false, failed: true });
    expect(words.title).toBe('We could not create the company');
    expect(words.intro).toBeNull();
    expect(words.primary).toBe('Try again');
    expect(words.caption).not.toBeNull();
  });

  it('speaks the reader’s language', async () => {
    const { t } = await createTranslator('hi');
    const words = companySignupWords(t, normal);
    expect(words.title).not.toBe('Your company');
    expect(words.primary).not.toBe('Create company');
  });
});
