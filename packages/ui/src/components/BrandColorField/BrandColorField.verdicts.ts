import type { ReadableInk, TextOnFill, WordOnPaper } from '../../utils/color-contrast';
import {
  asWordOnPaper,
  bestTextOn,
  MARK_CONTRAST_FLOOR,
  readableInk,
  TEXT_CONTRAST_FLOOR,
} from '../../utils/color-contrast';
import type {
  BrandColorFieldWords,
  BrandFullVerdictWords,
  BrandShortVerdictWords,
  BrandTextInk,
  BrandVerdict,
} from './BrandColorField.types';

/**
 * The two questions, answered once for both platform halves so the measurement and its sentence
 * cannot drift apart:
 *
 *   1. Can text sit ON this colour? White vs near-black, whichever wins, and whether it clears the
 *      floor. This decides what the proposal header uses.
 *   2. Can this colour BE text? The colour as a word on white paper. Most mid-tone brand colours
 *      fail this and that is fine — they stay fills, and words take the derived ink.
 */
export interface BrandColourReading {
  hex: string;
  on: TextOnFill;
  word: WordOnPaper;
  /** Which ink the words name — the field never spells it. */
  text: BrandTextInk;
  /**
   * The derived ink offered — `compliantShades(hex).ink`, the shade the server saves — when the
   * colour fails EITHER question; null when it passes both, or the offer is switched off.
   */
  fix: ReadableInk | null;
}

export function readBrandColour(hex: string, showSuggestion: boolean): BrandColourReading | null {
  const on = bestTextOn(hex);
  const word = asWordOnPaper(hex);
  if (on === null || word === null) return null;
  const fails = !on.passes || !word.passesText;
  const ink = fails && showSuggestion ? readableInk(hex) : null;
  return {
    hex,
    on,
    word,
    text: on.ink,
    fix: ink === null || ink.hex === hex ? null : ink,
  };
}

/** The colour the specimen sets its word in on paper: the colour itself, or its derived ink. */
export function specimenWordColour(reading: BrandColourReading): string {
  return reading.word.passesText ? reading.hex : (readableInk(reading.hex)?.hex ?? reading.hex);
}

/** `verdict="short"` — one line, no ratio. */
export function shortVerdict(
  reading: BrandColourReading,
  words: BrandShortVerdictWords,
): BrandVerdict {
  if (!reading.on.passes) return { kind: 'warn', sentence: words.noTextOnIt };
  if (reading.word.passesText) return { kind: 'pass', sentence: words.readsWell(reading.text) };
  return {
    kind: 'info',
    sentence: reading.word.passesMark
      ? words.fillsAndLines(reading.text)
      : words.fillsOnly(reading.text),
  };
}

/** `verdict="full"` — both questions with the ratios this field computed. */
export function fullVerdicts(
  reading: BrandColourReading,
  words: BrandFullVerdictWords,
): BrandVerdict[] {
  const { on, word } = reading;
  const floor = String(TEXT_CONTRAST_FLOOR);
  const textOn: BrandVerdict = on.passes
    ? {
        kind: 'pass',
        sentence: words.textOnPasses({ text: reading.text, ratio: String(on.ratio), floor }),
      }
    : {
        kind: 'warn',
        sentence: words.textOnFails({ white: String(on.white), black: String(on.black), floor }),
      };
  if (word.passesText) {
    return [textOn, { kind: 'pass', sentence: words.wordPasses({ ratio: String(word.ratio) }) }];
  }
  const ink = readableInk(reading.hex);
  const sentence = {
    ratio: String(word.ratio),
    ink: ink?.hex ?? reading.hex,
    inkRatio: String(ink?.ratio ?? word.ratio),
    markFloor: String(MARK_CONTRAST_FLOOR),
  };
  return [
    textOn,
    {
      kind: 'info',
      sentence: word.passesMark ? words.wordFillsAndRules(sentence) : words.wordFillsOnly(sentence),
    },
  ];
}

/** A caller's override, else the words' own — no English default exists anywhere. */
export function fieldWordsOf(
  words: BrandColorFieldWords,
  overrides: { label?: string; helper?: string; specimenLabel?: string; specimenWord?: string },
) {
  return {
    label: overrides.label ?? words.label,
    helper: overrides.helper ?? words.helper,
    specimenLabel: overrides.specimenLabel ?? words.specimenLabel,
    specimenWord: overrides.specimenWord ?? words.specimenWord,
  };
}
