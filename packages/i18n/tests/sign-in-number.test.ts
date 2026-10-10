import { describe, expect, it } from 'vitest';
import { SHELL } from '../src/copy/shell';
import { SIGN_IN } from '../src/copy/sign-in';
import { doorNoticeWords, type NumberStepFacts, numberStepWords } from '../src/copy/sign-in-number';
import { createTranslator } from '../src/runtime';

/**
 * The number step of either door (`SCR-M01-01` `m-normal` and its answers): the words follow the
 * facts — what the primary is doing, what the field refuses, whether Google is offered, and which
 * block stands above the number.
 */
const OPEN: NumberStepFacts = {
  notice: null,
  google: { busy: false, failed: false },
  problem: null,
  sending: false,
};
const LANGUAGES = ['en', 'hi', 'mr'] as const;

describe('numberStepWords — the primary says what it is doing', () => {
  it.each(LANGUAGES)('at rest and while the code is sending, in %s', async (language) => {
    const { t } = await createTranslator(language);
    expect(numberStepWords(t, OPEN).primary).toBe(t(SIGN_IN.sendCode));
    expect(numberStepWords(t, { ...OPEN, sending: true }).primary).toBe(t(SIGN_IN.sendingTheCode));
    expect(t(SIGN_IN.sendingTheCode)).not.toBe(t(SIGN_IN.sendCode));
  });
});

describe('numberStepWords — the field answers a number of the wrong length', () => {
  it.each(LANGUAGES)(
    'no refusal as it opens, both counts once pressed, in %s',
    async (language) => {
      const { t } = await createTranslator(language);
      expect(numberStepWords(t, OPEN).phoneError).toBeUndefined();
      const refused = numberStepWords(t, { ...OPEN, problem: { typed: 7, needed: 10 } });
      expect(refused.phoneError).toBe(t(SIGN_IN.digitsMismatch, { typed: 7, needed: 10 }));
      expect(refused.phoneError).toContain('7');
      expect(refused.phoneError).toContain('10');
      expect(refused.phoneLabel).toBe(t(SIGN_IN.mobileNumber));
    },
  );
});

describe('numberStepWords — Google is offered only by a door that has its sheet', () => {
  it('a door with no sheet draws no Google part', async () => {
    const { t } = await createTranslator('en');
    expect(numberStepWords(t, { ...OPEN, google: null }).google).toBeNull();
  });

  it.each(LANGUAGES)(
    'its spoken name states the rule, or that it is opening, in %s',
    async (language) => {
      const { t } = await createTranslator(language);
      const atRest = numberStepWords(t, OPEN).google;
      const opening = numberStepWords(t, { ...OPEN, google: { busy: true, failed: false } }).google;
      expect(atRest).toEqual({
        or: t(SIGN_IN.or),
        label: t(SIGN_IN.continueWithGoogle),
        aria: t(SIGN_IN.continueWithGoogleLabel),
      });
      expect(opening?.aria).toBe(t(SIGN_IN.openingGoogle));
    },
  );
});

describe('numberStepWords — the blocks above the number, the Google failure first', () => {
  it('none as the step opens', async () => {
    const { t } = await createTranslator('en');
    expect(numberStepWords(t, OPEN).blocks).toEqual([]);
  });

  it.each(LANGUAGES)('each block alone, then both in order, in %s', async (language) => {
    const { t } = await createTranslator(language);
    const failed = {
      tone: 'danger',
      title: t(SIGN_IN.googleFailedTitle),
      body: t(SIGN_IN.googleFailedBody),
      announce: 'alert',
    };
    const notReached = {
      tone: 'danger',
      title: t(SIGN_IN.requestFailedTitle),
      body: t(SIGN_IN.notReached),
      announce: 'alert',
    };
    const removed = { tone: 'info', title: t(SHELL.accessRemoved), announce: 'status' };
    const googleFailed = { busy: false, failed: true };

    expect(numberStepWords(t, { ...OPEN, google: googleFailed }).blocks).toEqual([failed]);
    expect(numberStepWords(t, { ...OPEN, notice: 'not-reached' }).blocks).toEqual([notReached]);
    expect(numberStepWords(t, { ...OPEN, notice: 'access-removed' }).blocks).toEqual([removed]);
    expect(
      numberStepWords(t, { ...OPEN, google: googleFailed, notice: 'not-reached' }).blocks,
    ).toEqual([failed, notReached]);
  });
});

describe('doorNoticeWords — the number step names what failed, then both sides', () => {
  it.each(LANGUAGES)('not-reached in %s', async (language) => {
    const { t } = await createTranslator(language);
    const words = doorNoticeWords(t, 'not-reached');
    expect(words).toEqual({
      tone: 'danger',
      title: t(SIGN_IN.requestFailedTitle),
      body: t(SIGN_IN.notReached),
      announce: 'alert',
    });
    const en = await createTranslator('en');
    if (language !== 'en') expect(words.body).not.toBe(en.t(SIGN_IN.notReached));
  });
});

describe('doorNoticeWords — a removal found at the door is a fact, not a refusal (S1.wrong.4)', () => {
  it.each(LANGUAGES)('access-removed in %s: the info tone, the title alone', async (language) => {
    const { t } = await createTranslator(language);
    expect(doorNoticeWords(t, 'access-removed')).toEqual({
      tone: 'info',
      title: t(SHELL.accessRemoved),
      announce: 'status',
    });
  });
});
