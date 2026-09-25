import { describe, expect, it } from 'vitest';
import { inLanguage, packLabel, uiLanguageOrSource } from '../../src/format/languages';
import { formatMoney } from '../../src/format/money';
import { IN_FORMATS } from '../../src/format/pack';

describe('packLabel — the one fallback (F3-05)', () => {
  it('reads the reader’s language where the pack authored it', () => {
    expect(packLabel({ en: 'Subsidy claimed', mr: 'अनुदान' }, 'mr')).toBe('अनुदान');
  });

  it('falls back to English where it did not — never a bare key, never a blank', () => {
    const label = packLabel({ en: 'Subsidy claimed' }, 'hi');
    expect(label).toBe('Subsidy claimed');
    expect(label).not.toBe('');
  });

  it('is the same fallback for any per-language value, a document body included', () => {
    const body = { en: { blocks: 1 }, mr: { blocks: 2 } };
    expect(inLanguage(body, 'mr')).toEqual({ blocks: 2 });
    expect(inLanguage(body, 'hi')).toEqual({ blocks: 1 });
  });
});

describe('uiLanguageOrSource — a language this build does not know (F3-26)', () => {
  it('keeps a language in the set', () => {
    expect(uiLanguageOrSource('mr')).toBe('mr');
    expect(uiLanguageOrSource('en')).toBe('en');
  });

  it('reads a language a newer server added as the source language, never a crash', () => {
    expect(uiLanguageOrSource('ta')).toBe('en');
  });

  it('reads an empty or oddly cased value as the source language — the set is exact', () => {
    expect(uiLanguageOrSource('')).toBe('en');
    expect(uiLanguageOrSource('HI')).toBe('en');
  });
});

describe('money renders identically in every IN language (F1-46, F1-47, F3-20)', () => {
  it('uses ₹ with lakh/crore grouping', () => {
    expect(formatMoney(IN_FORMATS, 452471)).toBe('₹4,52,471');
  });

  it('takes no language argument at all — that is what makes F3-20 hold by construction', () => {
    expect(formatMoney.length).toBe(3);
    expect(formatMoney(IN_FORMATS, 452471, { digits: 0 })).toBe('₹4,52,471');
  });

  it('renders Latin digits, never Devanagari numerals, in any locale (F1-47, F3-21)', () => {
    expect(formatMoney(IN_FORMATS, 452471)).toMatch(/^₹[0-9,]+$/);
  });
});
