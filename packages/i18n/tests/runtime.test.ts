import { describe, expect, it, vi } from 'vitest';
import { createI18nRuntime, createTranslator } from '../src/runtime';

/**
 * The two seams every screen and every engine rest on (`F3-04`, `F3-05`, `F3-06`), against the
 * REAL catalogs — never a mock of what this repo owns. A message id IS its English source text,
 * so an id no catalog holds must come back as itself: that is the fallback, and it is the one
 * thing "proven by running" cannot see, because a placeholder screen has no message to miss.
 */

/** A message every catalog holds (packages/i18n/src/copy/validation.ts). */
const HELD = 'This field is required.';
const HELD_IN = { en: HELD, hi: 'यह फ़ील्ड ज़रूरी है।', mr: 'हे फील्ड आवश्यक आहे.' } as const;
/** A message NO catalog holds — the gap F3-05 is about. */
const MISSING = 'This sentence is in no catalog.';

describe('createTranslator — one reader, one language (F3-06)', () => {
  it('two readers in two languages at one moment each get their own, and neither moves the other', async () => {
    const [mr, en] = await Promise.all([createTranslator('mr'), createTranslator('en')]);
    expect(mr.t(HELD)).toBe(HELD_IN.mr);
    expect(en.t(HELD)).toBe(HELD_IN.en);
    expect([mr.locale, en.locale]).toEqual(['mr', 'en']);
    expect(mr.dir).toBe('ltr');
  });

  it.each(['en', 'hi', 'mr'] as const)(
    '%s: a message the catalog lacks renders the English source — never a key, never blank (F3-05)',
    async (locale) => {
      const reader = await createTranslator(locale);
      expect(reader.t(MISSING)).toBe(MISSING);
      expect(reader.t(HELD)).toBe(HELD_IN[locale]);
    },
  );
});

describe('createI18nRuntime — one mount, switchable in place (F3-04)', () => {
  it('takes a copy module descriptor as is, the same sentence as by its id', () => {
    const runtime = createI18nRuntime('en');
    expect(runtime.t({ id: HELD })).toBe(runtime.t(HELD));
  });

  it('starts on the source language synchronously, with real messages, before any fetch', () => {
    const runtime = createI18nRuntime();
    expect(runtime.locale).toBe('en');
    expect(runtime.t(HELD)).toBe(HELD_IN.en);
  });

  it('switches the catalog on the SAME instance, so nothing rendered above it remounts', async () => {
    const runtime = createI18nRuntime();
    const instance = runtime.i18n;
    await runtime.setLocale('hi');
    expect(runtime.locale).toBe('hi');
    expect(runtime.i18n).toBe(instance);
    expect(runtime.t(HELD)).toBe(HELD_IN.hi);
    expect(runtime.t(MISSING)).toBe(MISSING);
  });

  it('treats a switch to the active language as nothing to do', async () => {
    const runtime = createI18nRuntime();
    const instance = runtime.i18n;
    await runtime.setLocale('en');
    expect(runtime.locale).toBe('en');
    expect(runtime.i18n).toBe(instance);
  });

  it.each([
    ['back to the active language', 'en'],
    ['on to a third language', 'mr'],
  ] as const)(
    'lets the last switch asked for win over one still loading — %s',
    async (_case, last) => {
      const runtime = createI18nRuntime();
      const overtaken = runtime.setLocale('hi');
      await Promise.all([overtaken, runtime.setLocale(last)]);
      expect(runtime.locale).toBe(last);
      expect(runtime.t(HELD)).toBe(HELD_IN[last]);
    },
  );

  it('paints the first frame in English and lets a requested language arrive a tick later', async () => {
    const runtime = createI18nRuntime('mr');
    expect(runtime.locale).toBe('en');
    await vi.waitFor(() => expect(runtime.locale).toBe('mr'));
    expect(runtime.t(HELD)).toBe(HELD_IN.mr);
  });
});

describe('every number in Latin digits, in every language (F3-21)', () => {
  /* An ICU plural's `#` is formatted by Intl, whose default Marathi digits are Devanagari; a plain
     `{n}` is printed as it is. Both must read 0–9, or one sentence mixes two digit systems. */
  const PLURAL = '{left, plural, one {# try left} other {# tries left}} on this code.';
  const COUNT = '{tries} wrong tries use a code up';
  const IN_MARATHI = {
    plural: 'या कोडवर 3 प्रयत्न शिल्लक आहेत.',
    count: '5 चुकीचे प्रयत्न एक कोड संपवतात',
  };

  it.each([
    ['createTranslator', async () => (await createTranslator('mr')).t],
    [
      'createI18nRuntime',
      async () => {
        const runtime = createI18nRuntime('mr');
        await vi.waitFor(() => expect(runtime.locale).toBe('mr'));
        return runtime.t;
      },
    ],
    [
      'setLocale',
      async () => {
        const runtime = createI18nRuntime();
        await runtime.setLocale('mr');
        return runtime.t;
      },
    ],
  ])('%s: a plural `#` and a plain count both read 0–9 in Marathi', async (_, translatorOf) => {
    const t = await translatorOf();
    expect(t(PLURAL, { left: 3 })).toBe(IN_MARATHI.plural);
    expect(t(COUNT, { tries: 5 })).toBe(IN_MARATHI.count);
  });
});
