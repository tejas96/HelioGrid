import { describe, expect, it } from 'vitest';
import {
  cityHelper,
  companyFacts,
  companyFieldWords,
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
  const normal = {
    restored: false,
    writing: false,
    failure: null,
    fieldRefused: false,
  };

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
      const words = companySignupWords(t, { ...normal, restored: true, failure });
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

  /**
   * The helpers and the intro belong to the step as it opens (`SCR-M01-02` word plan): a resumed
   * frame, a field refusing the press and a failed write carry none.
   */
  it.each([
    ['as it opens', {}, true],
    ['resumed', { restored: true }, false],
    ['with a field refusing the press', { fieldRefused: true }, false],
    ['after a refusal', { failure: 'failed' }, false],
    ['after no answer', { failure: 'unreached' }, false],
  ] as const)('the step %s: its helpers and intro', async (_name, facts, opens) => {
    const { t } = await createTranslator('en');
    const words = companySignupWords(t, { ...normal, ...facts });
    expect(words.helpers).toEqual(
      opens
        ? { ownerName: 'You become the first EPC owner.', cityWhileEmpty: "Where you're based." }
        : { ownerName: null, cityWhileEmpty: null },
    );
    expect(words.intro !== null).toBe(opens);
  });

  it.each([
    ['an empty City', '', "Where you're based."],
    ['spaces only', '  ', "Where you're based."],
    ['a typed City', 'Pune', undefined],
  ] as const)('the city line under %s', (_name, city, line) => {
    const helpers = { ownerName: null, cityWhileEmpty: "Where you're based." };
    expect(cityHelper(helpers, city)).toBe(line);
    expect(cityHelper(undefined, city)).toBeUndefined();
  });

  it('speaks the reader’s language', async () => {
    const { t } = await createTranslator('hi');
    const words = companySignupWords(t, normal);
    expect(words.title).not.toBe('Your company');
    expect(words.primary).not.toBe('Create company');
  });
});

/**
 * Every word one company field shows (`SCR-M01-02`, step 3 and the fields-invalid state): its
 * label and example, the step's line under it for the value typed, and its answer to a press.
 */
describe('companyFieldWords', () => {
  const opens = {
    ownerName: 'You become the first EPC owner.',
    cityWhileEmpty: "Where you're based.",
  };
  const untouched = { helpers: undefined, value: '', error: undefined };

  it.each([
    ['en', 'companyName', 'Company name', 'Suryodaya Solar Solutions'],
    ['en', 'ownerName', 'Your name', 'Rajesh Kulkarni'],
    ['en', 'city', 'City', 'Pune'],
    ['hi', 'companyName', 'कंपनी का नाम', 'सूर्योदय सोलर सॉल्यूशंस'],
    ['hi', 'ownerName', 'आपका नाम', 'राजेश कुलकर्णी'],
    ['hi', 'city', 'शहर', 'पुणे'],
    ['mr', 'companyName', 'कंपनीचे नाव', 'सूर्योदय सोलर सोल्युशन्स'],
    ['mr', 'ownerName', 'तुमचे नाव', 'राजेश कुलकर्णी'],
    ['mr', 'city', 'शहर', 'पुणे'],
  ] as const)(
    'in %s, %s carries its name and its example, and nothing under it',
    async (language, field, label, placeholder) => {
      const { t } = await createTranslator(language);
      expect(companyFieldWords(t, field, untouched)).toEqual({
        label,
        placeholder,
        helper: undefined,
        error: undefined,
      });
    },
  );

  it.each([
    ['companyName', '', undefined],
    ['ownerName', '', 'You become the first EPC owner.'],
    ['ownerName', 'Rajesh Kulkarni', 'You become the first EPC owner.'],
    ['city', '', "Where you're based."],
    ['city', '  ', "Where you're based."],
    ['city', 'P', undefined],
  ] as const)('%s holding "%s": the step’s line under it', async (field, value, line) => {
    const { t } = await createTranslator('en');
    expect(companyFieldWords(t, field, { ...untouched, helpers: opens, value }).helper).toBe(line);
    expect(companyFieldWords(t, field, { ...untouched, value }).helper).toBeUndefined();
    const none = { ownerName: null, cityWhileEmpty: null };
    expect(
      companyFieldWords(t, field, { ...untouched, helpers: none, value }).helper,
    ).toBeUndefined();
  });

  it.each([
    ['en', 'A city is needed — it is where your company is based.'],
    ['hi', 'शहर ज़रूरी है — यही बताता है कि आपकी कंपनी कहाँ है।'],
    ['mr', 'शहर आवश्यक आहे — तुमची कंपनी कुठे आहे हे त्यावरून कळते.'],
  ] as const)('in %s, a City left empty says why it is needed', async (language, needed) => {
    const { t } = await createTranslator(language);
    const error = { type: 'too_small', message: 'x' };
    expect(companyFieldWords(t, 'city', { ...untouched, error }).error).toBe(needed);
  });

  it('a refusal that is not about emptiness keeps the words it came with', async () => {
    const { t } = await createTranslator('en');
    const error = { type: 'custom', message: 'That city is closed.' };
    expect(companyFieldWords(t, 'city', { ...untouched, value: 'Pune', error }).error).toBe(
      'That city is closed.',
    );
  });
});

/** The three values while they are written (`SCR-M01-02`, the loading state): each under its own field's name. */
describe('companyFacts', () => {
  it('pairs each value with its field’s name, in the fields’ order', async () => {
    const { t } = await createTranslator('en');
    const values = { companyName: 'Suryodaya Solar', ownerName: 'Rajesh Kulkarni', city: 'Pune' };
    expect(companyFacts(t, values)).toEqual([
      { label: 'Company name', value: 'Suryodaya Solar' },
      { label: 'Your name', value: 'Rajesh Kulkarni' },
      { label: 'City', value: 'Pune' },
    ]);
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
