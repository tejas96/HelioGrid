import { describe, expect, it } from 'vitest';
import { shownInNote } from '../src/copy/authored-content';
import { createTranslator } from '../src/runtime';

/** The note reads in the reader's language, names both languages by their own names, and is absent when there is nothing to say (F3-10). */
describe('shownInNote', () => {
  it('says which language is shown and which was asked for, in each catalog, and the three differ', async () => {
    const notes = await Promise.all(
      (['en', 'hi', 'mr'] as const).map(async (locale) => {
        const { t } = await createTranslator(locale);
        return shownInNote(t, 'en', 'mr');
      }),
    );
    for (const note of notes) {
      expect(note).toContain('English');
      expect(note).toContain('मराठी');
    }
    expect(new Set(notes).size).toBe(notes.length);
  });

  it('is nothing at all when the content is in the reader’s language', async () => {
    const { t } = await createTranslator('mr');
    expect(shownInNote(t, 'mr', 'mr')).toBeNull();
  });

  it('never translates the language names — an endonym reads identically in every catalog', async () => {
    const { t: hi } = await createTranslator('hi');
    const { t: en } = await createTranslator('en');
    expect(shownInNote(hi, 'en', 'hi')).toContain('हिन्दी');
    expect(shownInNote(en, 'en', 'hi')).toContain('हिन्दी');
  });
});
