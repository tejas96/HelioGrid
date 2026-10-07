import { describe, expect, it } from 'vitest';
import {
  companySignupWords,
  joinSteerFinding,
  joinSteerWords,
} from '../src/copy/company-signup-frames';
import { joinRequestNotice } from '../src/copy/join-request';
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

/**
 * The join steer's primary, and the failure it carries after a request that did not go through
 * (`M01-09`, `SCR-M01-02` request-failed): the steer stays whole, and the join road asks again.
 */
describe('joinSteerWords', () => {
  it.each([
    ['asks to join while nothing has failed', false, 'Request to join', null],
    [
      'says the request did not go through, and offers to send it again',
      true,
      'Send the request again',
      {
        title: 'Your request did not go through',
        body: 'Something on our side or the connection failed, so nothing was sent.',
      },
    ],
  ] as const)('%s', async (_name, failed, primary, failure) => {
    const { t } = await createTranslator('en');
    expect(joinSteerWords(t, failed)).toEqual({ primary, failure });
  });
});

/** The notice an EPC Owner reads, rendered in the owner's language and stored as written (`F6-08`). */
describe('joinRequestNotice', () => {
  const asker = { name: 'Meera Joshi', phone: '+91 94220 31088' };

  it('names the asker, the number and the company', async () => {
    const { t } = await createTranslator('en');
    expect(joinRequestNotice(t, asker, 'Suryodaya Solar')).toEqual({
      title: 'Meera Joshi asks to join',
      body: '+91 94220 31088 asked to be added to Suryodaya Solar.',
    });
  });

  it.each(['hi', 'mr'] as const)(
    'is written in %s, keeping the typed name and the number',
    async (language) => {
      const { t } = await createTranslator(language);
      const notice = joinRequestNotice(t, asker, 'Suryodaya Solar');
      expect(notice.title).toContain(asker.name);
      expect(notice.title).not.toContain('asks to join');
      expect(notice.body).toContain(asker.phone);
    },
  );
});

/** The steer's finding names the company and keeps the asker's number on one line (`M01-09`). */
describe('joinSteerFinding', () => {
  it('names the company and its city, and never breaks the number', async () => {
    const { t } = await createTranslator('en');
    expect(
      joinSteerFinding(t, { companyName: 'Suryodaya Solar', city: 'Pune' }, '+91 94220 31088'),
    ).toEqual({
      title: 'A workspace already exists for Suryodaya Solar in Pune',
      body: 'Asking to join sends its owner a request to add +91\u00A094220\u00A031088.',
    });
  });
});
