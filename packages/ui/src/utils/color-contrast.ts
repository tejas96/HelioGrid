import {
  compliantShades,
  contrastRatio,
  MARK_CONTRAST_FLOOR,
  normaliseHexColour,
  TEXT_CONTRAST_FLOOR,
} from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';

/**
 * The document's two questions about a tenant brand colour — N4 / F7-11 — bound to the inks this
 * design system draws with. The MATHS is `@heliogrid/domain`'s (`contrastRatio`, the floors, and
 * the shade walk a server and a screen must answer alike); this file implements none of it and
 * only says WHICH colours are being measured:
 *
 *   1. Can text sit ON this colour?  → the colour is a FILL (a header band). White or near-black
 *      rides on top; we report which, and its ratio.
 *   2. Can this colour BE text?      → the colour is a WORD on the document's white paper. Most
 *      mid-tone brand colours fail this and that is fine — they stay fills.
 *
 * The TENANT colour never enters the operator app's styling; it is only ever measured and drawn
 * inside a document preview. The three fixed colours it is measured AGAINST are ours, so they are
 * read from `@heliogrid/theme` rather than re-declared here — two spellings of white is exactly
 * how a measured floor stops matching what ships. Each takes the token for its ROLE: `WHITE` and
 * `NEAR_BLACK` are the document's two inks, `PAPER` is the sheet they sit on. (`--action-primary`
 * carries the same `#0A0A0B`, but that is the button-fill role, not an ink.)
 */

/** White ink — one of the two colours that may ride on a brand fill. */
export const WHITE: string = theme.colors['text-inverse'];
/** Near-black ink — the other. */
export const NEAR_BLACK: string = theme.colors['text-primary'];
/** The document's paper, which a brand colour has to carry a word on. */
export const PAPER: string = theme.colors.surface;
/* Both floors keep domain's names: one fact, one name, so a sentence in a component and the
   walk that answers it cannot be read as two different numbers. */
export { MARK_CONTRAST_FLOOR, TEXT_CONTRAST_FLOOR };

/** WCAG contrast ratio, rounded to 2dp for display. Null when either colour will not parse. */
export function contrast(a: string, b: string): number | null {
  const ah = normaliseHexColour(a);
  const bh = normaliseHexColour(b);
  if (ah === null || bh === null) return null;
  return Math.round(contrastRatio(ah, bh) * 100) / 100;
}

/** Which of the two document text colours can sit on a fill, and how well. */
export interface TextOnFill {
  /** The winning text colour, "#RRGGBB". */
  color: string;
  /** Its name, for the sentence — "White" or "Near-black". */
  name: string;
  /** The winner's ratio. */
  ratio: number;
  /** Whether the better of the two clears the text floor. */
  passes: boolean;
  white: number;
  black: number;
}

/** Which of the two document text colours can sit on this fill, and how well. */
export function bestTextOn(fill: string): TextOnFill | null {
  const onWhite = contrast(WHITE, fill);
  const onBlack = contrast(NEAR_BLACK, fill);
  if (onWhite === null || onBlack === null) {
    return null;
  }
  const whiteWins = onWhite >= onBlack;
  return {
    color: whiteWins ? WHITE : NEAR_BLACK,
    name: whiteWins ? 'White' : 'Near-black',
    ratio: whiteWins ? onWhite : onBlack,
    passes: Math.max(onWhite, onBlack) >= TEXT_CONTRAST_FLOOR,
    white: onWhite,
    black: onBlack,
  };
}

/** The colour measured as a word on the document's paper. */
export interface WordOnPaper {
  ratio: number;
  passesText: boolean;
  passesMark: boolean;
}

/** Can the colour itself set a word on the document's paper? */
export function asWordOnPaper(color: string): WordOnPaper | null {
  const ratio = contrast(color, PAPER);
  if (ratio === null) {
    return null;
  }
  return {
    ratio,
    passesText: ratio >= TEXT_CONTRAST_FLOOR,
    passesMark: ratio >= MARK_CONTRAST_FLOOR,
  };
}

/** The shade a colour becomes when it has to carry a word, and what that shade measures. */
export interface ReadableInk {
  hex: string;
  ratio: number;
}

/**
 * The same hue, darkened until words can sit in it on paper — domain's one walk, so the shade a
 * field OFFERS is the shade the server derives for the same colour. Null when it will not parse.
 */
export function readableInk(color: string): ReadableInk | null {
  const hex = normaliseHexColour(color);
  if (hex === null) return null;
  const { ink } = compliantShades(hex);
  const ratio = contrast(ink, PAPER);
  return ratio === null ? null : { hex: ink, ratio };
}
