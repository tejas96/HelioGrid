import { describe, expect, it } from 'vitest';
import { formatDate, formatMonthYear, formatTime } from '../../src/format/datetime';
import { formatLength } from '../../src/format/measurement';
import { formatCompactMoney, formatMoney } from '../../src/format/money';
import { formatNumber } from '../../src/format/number';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';

/**
 * `F3-20` and `F3-22`'s acceptance line: a reader who switches interface language re-reads the
 * same amount and measurement CHARACTER-IDENTICAL, and the same date with only its month and
 * weekday names in their own words. Only those words change.
 *
 * Money, numbers and measurements take a market pack and never a language, so for them the
 * property holds because the reader's language is not an input. A date takes the language for its
 * names alone. What is worth testing is the EDGE: what happens when a language tag reaches the
 * locale where the market's belongs. Every case below is that edge, and each one is a rendering a
 * reader would accept as correct while being wrong.
 */

/** What a surface builds if it lets the reader's language reach the pack. This is the defect. */
function packInReaderLanguage(language: string): FormatPack {
  return { ...IN_FORMATS, locale: language };
}

const AMOUNT = 452471;
/** 19:00 UTC — 00:30 the next day in Asia/Kolkata, so the tenant zone decides the date. */
const INSTANT = '2026-03-11T19:00:00Z';

describe('a language reaching the pack changes the value, which is why it never does', () => {
  it('moves every rendering at once, so the failure is total rather than partial', () => {
    const market = [
      formatMoney(IN_FORMATS, AMOUNT),
      formatCompactMoney(IN_FORMATS, 9_200_000),
      formatNumber(IN_FORMATS, AMOUNT),
      formatDate(IN_FORMATS, INSTANT, 'en'),
      formatTime(IN_FORMATS, '17:00'),
      formatLength(IN_FORMATS, 4.2),
    ];
    const leaked = [
      formatMoney(packInReaderLanguage('hi-IN-u-nu-deva'), AMOUNT),
      formatCompactMoney(packInReaderLanguage('hi-IN-u-nu-deva'), 9_200_000),
      formatNumber(packInReaderLanguage('hi-IN-u-nu-deva'), AMOUNT),
      formatDate(packInReaderLanguage('hi-IN-u-nu-deva'), INSTANT, 'en'),
      formatTime(packInReaderLanguage('hi-IN-u-nu-deva'), '17:00'),
      formatLength(packInReaderLanguage('hi-IN-u-nu-deva'), 4.2),
    ];
    expect(leaked).not.toEqual(market);
  });

  it("takes a date's names from the reader, and its order and digits from the market", () => {
    /* The reader's language moves the month's word and nothing else. Let the reader's tag reach
       the pack instead, and Marathi's own pattern brings its comma and its Devanagari digits. */
    expect(formatDate(IN_FORMATS, '2026-10-01T06:00:00Z', 'mr')).toBe('1 ऑक्टो 2026');
    expect(formatDate(packInReaderLanguage('mr-IN'), '2026-10-01T06:00:00Z', 'mr')).toBe(
      '१ ऑक्टो, २०२६',
    );
    expect(formatMonthYear(IN_FORMATS, '2026-03-12T06:00:00Z', 'en')).toBe('March 2026');
  });
});

describe('Latin digits survive a pack authored with any tag (F3-21)', () => {
  it('renders 0–9 where the numbering system is pinned, and does not where it is not', () => {
    /* `-u-nu-latn` is the pin `IN_FORMATS` carries. Its absence is the whole defect. */
    expect(formatNumber(packInReaderLanguage('hi-IN-u-nu-latn'), AMOUNT)).toBe('4,52,471');
    expect(formatNumber(packInReaderLanguage('hi-IN-u-nu-deva'), AMOUNT)).not.toBe('4,52,471');
  });

  it('carries the pin on the shipped pack, so no rendering of it can hold another script', () => {
    const NON_LATIN_DIGIT = /\p{Nd}/gu;
    const rendered = [
      formatMoney(IN_FORMATS, AMOUNT),
      formatCompactMoney(IN_FORMATS, 14_000_000),
      formatDate(IN_FORMATS, INSTANT, 'mr'),
      formatDate(IN_FORMATS, INSTANT, 'hi'),
    ].join(' ');
    const foreign = [...rendered.matchAll(NON_LATIN_DIGIT)].filter((m) => !/[0-9]/.test(m[0]));
    expect(foreign).toEqual([]);
  });
});
