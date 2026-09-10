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

  it('paints the first frame in English and lets a requested language arrive a tick later', async () => {
    const runtime = createI18nRuntime('mr');
    expect(runtime.locale).toBe('en');
    await vi.waitFor(() => expect(runtime.locale).toBe('mr'));
    expect(runtime.t(HELD)).toBe(HELD_IN.mr);
  });
});
