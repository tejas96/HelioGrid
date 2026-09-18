import { describe, expect, it } from 'vitest';
import { authoredIn, UI_LANGUAGES } from '../../src/format/languages';

/**
 * `F3-10`'s labelled fallback: a tenant's words are shown in the reader's language where written,
 * otherwise the ORIGINAL with the truth about its language beside it — never a third language
 * dressed as the reader's, and never silently.
 */
describe('authoredIn — the labelled fallback for a tenant’s own words (F3-10)', () => {
  const terms = { en: 'Valid until the date stated.', hi: 'बताई गई तारीख तक मान्य।' };

  it('shows the reader’s language where the tenant wrote it, and says so', () => {
    expect(authoredIn(terms, 'hi')).toEqual({
      value: terms.hi,
      requested: 'hi',
      shownIn: 'hi',
      missing: ['mr'],
    });
  });

  it('shows the ORIGINAL where the tenant did not — never the nearest other language', () => {
    const shown = authoredIn(terms, 'mr');
    expect(shown.value).toBe(terms.en);
    expect(shown.value).not.toBe(terms.hi);
    expect(shown.shownIn).toBe('en');
    expect(shown.requested).toBe('mr');
  });

  it('is the original itself when the original is asked for', () => {
    expect(authoredIn(terms, 'en')).toMatchObject({
      value: terms.en,
      shownIn: 'en',
      requested: 'en',
    });
  });

  it('names every unwritten language for the author, in the set’s order, and none when all are written', () => {
    expect(authoredIn({ en: 'x' }, 'en').missing).toEqual(['hi', 'mr']);
    expect(authoredIn({ en: 'x', mr: 'य' }, 'en').missing).toEqual(['hi']);
    expect(authoredIn({ en: 'x', hi: 'य', mr: 'य' }, 'en').missing).toEqual([]);
    expect(UI_LANGUAGES.includes('en')).toBe(true);
  });

  it('treats a stored null as unwritten, not as content', () => {
    const shown = authoredIn({ en: 'x', mr: null as unknown as string }, 'mr');
    expect(shown.shownIn).toBe('en');
    expect(shown.missing).toEqual(['hi', 'mr']);
  });

  it('carries any shape — a document body falls back exactly as a line does', () => {
    const body = { en: { blocks: 1 }, mr: { blocks: 2 } };
    expect(authoredIn(body, 'mr').value).toEqual({ blocks: 2 });
    expect(authoredIn(body, 'hi')).toMatchObject({ value: { blocks: 1 }, shownIn: 'en' });
  });
});
