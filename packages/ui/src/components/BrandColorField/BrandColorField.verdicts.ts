import type { TextOnFill, WordOnPaper } from '../../utils/color-contrast';
import { MARK_FLOOR, TEXT_FLOOR } from '../../utils/color-contrast';
import type { BrandVerdict } from './BrandColorField.types';

/**
 * The two questions, answered in words with the ratio — shared by both platform halves so the
 * measurement and its sentence cannot drift apart.
 *
 *   1. Can text sit ON this colour? White vs near-black, whichever wins, and whether it clears the
 *      floor. This decides what the proposal header uses.
 *   2. Can this colour BE text? The colour as a word on white paper. Most mid-tone brand colours
 *      fail this and that is fine — they stay fills. The control says so plainly.
 */
export function textOnFillVerdict(on: TextOnFill): BrandVerdict {
  if (on.passes) {
    return {
      kind: 'pass',
      sentence: `${on.name} text on this colour is ${on.ratio}:1 — clears the ${TEXT_FLOOR}:1 floor, so the proposal header uses ${on.name.toLowerCase()}.`,
    };
  }
  return {
    kind: 'warn',
    sentence: `No text colour clears ${TEXT_FLOOR}:1 on this — white reaches ${on.white}:1 and near-black ${on.black}:1. A header band in it would be unreadable on a printed proposal.`,
  };
}

export function wordOnPaperVerdict(word: WordOnPaper): BrandVerdict {
  if (word.passesText) {
    return {
      kind: 'pass',
      sentence: `As a word on white paper it is ${word.ratio}:1 — headings and totals can be set in it.`,
    };
  }
  const alsoRules = word.passesMark ? ' and rules' : '';
  const floorClause = word.passesMark
    ? `above the ${MARK_FLOOR}:1 mark floor`
    : `below even the ${MARK_FLOOR}:1 mark floor, so hairlines in it will not read either`;
  return {
    kind: 'info',
    sentence: `As a word on white paper it is only ${word.ratio}:1, so the proposal keeps text near-black and uses this colour as a fill${alsoRules} — ${floorClause}.`,
  };
}
