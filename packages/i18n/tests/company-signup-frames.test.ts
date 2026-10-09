import { describe, expect, it } from 'vitest';
import {
  companySignupWords,
  joinSteerFinding,
  joinSteerWords,
} from '../src/copy/company-signup-frames';
import { joinRequestNotice } from '../src/copy/join-request';
import { createTranslator } from '../src/runtime';

/**
 * The five frames the company step draws (`SCR-M01-02`), in words both platforms say the same
 * way: the normal frame carries an intro, the resumed frame greets, the writing frame names the
 * write, the refused frame says nothing was created, and the unanswered frame says it may have been.
 */
describe('companySignupWords', () => {
  const normal = { restored: false, writing: false, failure: null };

  it('the normal frame: the title, an intro, the create primary, no caption', async () => {
    const { t } = await createTranslator('en');
    const words = companySignupWords(t, normal);
    expect(words.title).toBe('Your company');
    expect(words.intro).not.toBeNull();
    expect(words.primary).toBe('Create company');
    expect(words.caption).toBeNull();
    expect(words.block).toBeNull();
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

  /** A refusal is known to have created nothing; a create with no answer may have made it (`F8-36`). */
  it.each([
    [
      'failed',
      'We could not create the company',
      {
        tone: 'danger',
        title: 'Something on our side failed',
        body: 'Nothing was created, so trying again is safe.',
      },
    ],
    [
      'unreached',
      'We could not confirm the company',
      {
        tone: 'danger',
        title: 'We did not hear back',
        body: 'Your company may have been made — trying again cannot make a second.',
      },
    ],
  ] as const)(
    'the %s frame outranks resumed: its own heading and block, try again',
    async (failure, title, block) => {
      const { t } = await createTranslator('en');
      const words = companySignupWords(t, { restored: true, writing: false, failure });
      expect(words.title).toBe(title);
      expect(words.block).toEqual(block);
      expect(words.intro).toBeNull();
      expect(words.primary).toBe('Try again');
      expect(words.caption).toBe('If it keeps failing, sign in later to carry on.');
    },
  );

  it('the not-reached frame speaks Hindi and Marathi as the board does', async () => {
    const hi = companySignupWords((await createTranslator('hi')).t, {
      ...normal,
      failure: 'unreached',
    });
    expect(hi.title).toBe('कंपनी बनने की पुष्टि नहीं हो सकी');
    expect(hi.block?.body).toBe('आपकी कंपनी शायद बन गई हो — फिर से कोशिश करने से दूसरी नहीं बनेगी।');
    const mr = companySignupWords((await createTranslator('mr')).t, {
      ...normal,
      failure: 'unreached',
    });
    expect(mr.title).toBe('कंपनी तयार झाल्याची खात्री झाली नाही');
    expect(mr.block?.body).toBe(
      'तुमची कंपनी कदाचित तयार झाली असेल — पुन्हा प्रयत्न केल्याने दुसरी तयार होणार नाही.',
    );
  });

  it('speaks the reader’s language', async () => {
    const { t } = await createTranslator('hi');
    const words = companySignupWords(t, normal);
    expect(words.title).not.toBe('Your company');
    expect(words.primary).not.toBe('Create company');
  });
});

/**
 * The join steer's primary, and the failure it carries after a request that did not land
 * (`M01-09`, `SCR-M01-02` request-failed, request-not-reached): the steer stays whole, and the join
 * road asks again.
 */
describe('joinSteerWords', () => {
  it.each([
    ['asks to join while nothing has failed', null, 'Request to join', null],
    [
      'after a refusal, says nothing was sent, and offers to send it again',
      'failed',
      'Send the request again',
      {
        tone: 'danger',
        title: 'Your request did not go through',
        body: 'Something on our side failed, so nothing was sent.',
      },
    ],
    [
      'after no answer, never claims nothing was sent (F8-36)',
      'unreached',
      'Send the request again',
      {
        tone: 'danger',
        title: 'We did not hear back',
        body: 'Your request may already be with the owner.',
      },
    ],
  ] as const)('%s', async (_name, failure, primary, block) => {
    const { t } = await createTranslator('en');
    expect(joinSteerWords(t, failure)).toEqual({ primary, failure: block });
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
