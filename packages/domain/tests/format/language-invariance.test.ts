import { describe, expect, it } from 'vitest';
import { formatDate, formatMonthYear, formatTime } from '../../src/format/datetime';
import { formatLength } from '../../src/format/measurement';
import { formatCompactMoney, formatMoney } from '../../src/format/money';
import { formatNumber } from '../../src/format/number';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';

/**
 * `F3-20` and `F3-22`'s acceptance line: a reader who switches interface language re-reads the
 * same amount, date and measurement CHARACTER-IDENTICAL. Only the words around the value change.
 *
 * The formatters take a market pack and never a language, so the property holds because the
 * reader's language is not an input. What is worth testing is therefore not the invariance — a
 * test that called the same function twice would prove nothing — but its EDGE: what happens when
 * a language tag reaches the locale where the market's belongs. Every case below is that edge,
 * and each one is a rendering a reader would accept as correct while being wrong.
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
      formatDate(IN_FORMATS, INSTANT),
      formatTime(IN_FORMATS, '17:00'),
      formatLength(IN_FORMATS, 4.2),
    ];
    const leaked = [
      formatMoney(packInReaderLanguage('hi-IN-u-nu-deva'), AMOUNT),
      formatCompactMoney(packInReaderLanguage('hi-IN-u-nu-deva'), 9_200_000),
      formatNumber(packInReaderLanguage('hi-IN-u-nu-deva'), AMOUNT),
      formatDate(packInReaderLanguage('hi-IN-u-nu-deva'), INSTANT),
      formatTime(packInReaderLanguage('hi-IN-u-nu-deva'), '17:00'),
      formatLength(packInReaderLanguage('hi-IN-u-nu-deva'), 4.2),
    ];
    expect(leaked).not.toEqual(market);
  });

  it('takes the month NAME from the market, never from the reader', () => {
    /* `12 Mar 2026` must read the same in English, Hindi and Marathi. It only does because the
       name comes from `pack.locale`; a reader's tag here renders the month in their script. */
    expect(formatDate(IN_FORMATS, '2026-03-12T06:00:00Z')).toBe('12 Mar 2026');
    expect(formatMonthYear(IN_FORMATS, '2026-03-12T06:00:00Z')).toBe('March 2026');
    expect(formatMonthYear(packInReaderLanguage('mr-IN'), '2026-03-12T06:00:00Z')).not.toBe(
      'March 2026',
    );
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
      formatDate(IN_FORMATS, INSTANT),
    ].join(' ');
    const foreign = [...rendered.matchAll(NON_LATIN_DIGIT)].filter((m) => !/[0-9]/.test(m[0]));
    expect(foreign).toEqual([]);
  });
});
