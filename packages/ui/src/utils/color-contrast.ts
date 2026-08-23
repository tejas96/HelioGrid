import { theme } from '@heliogrid/theme';

/**
 * Contrast maths for the tenant brand colour — N4 / F7-11.
 *
 * The contrast floor in this system is measured, never eyeballed. A tenant-supplied colour is the
 * one colour in the product nobody on our side has checked, and it goes behind text on a
 * customer-facing document. So the check has to happen at entry time, in the component.
 *
 * Two different questions get two different answers, and conflating them is how a picker lies:
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
/** The floor for body-size text, both WCAG AA and this system's own rule. */
export const TEXT_FLOOR = 4.5;
/** WCAG's floor for a meaningful non-text mark — a rule, a bar, an icon. */
export const MARK_FLOOR = 3;

/** A parsed colour, 0–255 per channel. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Either spelling of a colour these helpers accept. */
export type ColorInput = string | Rgb;

function expandShorthand(short: string): string | null {
  const [r, g, b] = short;
  if (r === undefined || g === undefined || b === undefined) {
    return null;
  }
  return `${r}${r}${g}${g}${b}${b}`;
}

/** Accepts "#RGB", "#RRGGBB", with or without the hash. Returns null for anything else. */
export function parseHex(input: unknown): Rgb | null {
  if (typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim().replace(/^#/, '');
  const h = trimmed.length === 3 ? expandShorthand(trimmed) : trimmed;
  if (h === null || !/^[0-9a-fA-F]{6}$/.test(h)) {
    return null;
  }
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const p = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${p(r)}${p(g)}${p(b)}`.toUpperCase();
}

/** Normalises any accepted input to "#RRGGBB", or null. */
export function normaliseHex(input: unknown): string | null {
  const rgb = parseHex(input);
  return rgb === null ? null : toHex(rgb);
}

function linear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: ColorInput): number | null {
  const rgb = typeof color === 'string' ? parseHex(color) : color;
  if (rgb === null) {
    return null;
  }
  return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
}

/** WCAG contrast ratio, rounded to 2dp. Returns null if either colour won't parse. */
export function contrast(a: ColorInput, b: ColorInput): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) {
    return null;
  }
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Which of the two document text colours can sit on a fill, and how well. */
export interface TextOnFill {
  /** The winning text colour, "#RRGGBB". */
  color: string;
  /** Its name, for the sentence — "White" or "Near-black". */
  name: string;
  /** The winner's ratio. */
  ratio: number;
  /** Whether the better of the two clears TEXT_FLOOR. */
  passes: boolean;
  white: number;
  black: number;
}

/** Which of the two document text colours can sit on this fill, and how well. */
export function bestTextOn(fill: ColorInput): TextOnFill | null {
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
    passes: Math.max(onWhite, onBlack) >= TEXT_FLOOR,
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
export function asWordOnPaper(color: ColorInput): WordOnPaper | null {
  const ratio = contrast(color, PAPER);
  if (ratio === null) {
    return null;
  }
  return { ratio, passesText: ratio >= TEXT_FLOOR, passesMark: ratio >= MARK_FLOOR };
}

/** The same hue, darkened until it clears the target. */
export interface DarkenedColor {
  hex: string;
  ratio: number;
}

/**
 * Darkens toward black in small steps, holding hue, until the colour clears `target` on paper.
 * Used to OFFER a fix rather than merely refusing one. Returns null if nothing passes.
 */
export function darkenToPass(
  color: string,
  target: number = TEXT_FLOOR,
  against: ColorInput = PAPER,
): DarkenedColor | null {
  const rgb = parseHex(color);
  if (rgb === null) {
    return null;
  }
  for (let f = 1; f >= 0; f -= 0.02) {
    const cand = toHex({ r: rgb.r * f, g: rgb.g * f, b: rgb.b * f });
    const c = contrast(cand, against);
    if (c !== null && c >= target) {
      return { hex: cand, ratio: c };
    }
  }
  return null;
}
