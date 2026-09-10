/**
 * `F7-07`, `M01-50` — a palette is never rejected. A tenant's brand colour is MEASURED, and what
 * cannot carry words is answered with a shade that can: the same hue darkened until it clears the
 * text floor on paper, which also makes white honest on a fill of it. The design system's
 * `CustomerSurface` and `DocumentPreview` measure the same two questions; this is the server's
 * copy of the answer, so a document and a link page agree. Pure — a colour in, colours out.
 */

/** The WCAG 2.x floor for words (`F7-11`, `N4`): the ratio text needs against what it sits on. */
export const TEXT_CONTRAST_FLOOR = 4.5;

const WHITE = '#FFFFFF';
/** The one shape a brand colour takes on the wire and in the store — contracts validates against this same pattern. */
export const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
/** How far the lightness drops per step, on a 0–1 scale: fine enough that the answer is the nearest passing shade. */
const LIGHTNESS_STEP = 0.01;

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** `#RGB` or `#RRGGBB`, either case — the one shape the contract accepts. */
export function isHexColour(value: string): boolean {
  return HEX_COLOUR.test(value);
}

function toRgb(hex: string): Rgb {
  if (!isHexColour(hex)) throw new RangeError(`a brand colour is #RRGGBB, not ${hex}`);
  const digits = hex.slice(1);
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: Rgb): string {
  const pair = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${pair(r)}${pair(g)}${pair(b)}`.toUpperCase();
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast between two colours, 1 to 21; symmetric, so which is the text does not matter. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(toRgb(a));
  const lb = relativeLuminance(toRgb(b));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

interface Hsl {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

function toHsl({ r, g, b }: Rgb): Hsl {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
  else if (max === gg) h = (bb - rr) / d + 2;
  else h = (rr - gg) / d + 4;
  return { h: h / 6, s, l };
}

function hueToChannel(p: number, q: number, t: number): number {
  const hue = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
  if (hue < 1 / 6) return p + (q - p) * 6 * hue;
  if (hue < 1 / 2) return q;
  if (hue < 2 / 3) return p + (q - p) * (2 / 3 - hue) * 6;
  return p;
}

function fromHsl({ h, s, l }: Hsl): Rgb {
  const channel = (value: number) => Math.round(value * 255);
  if (s === 0) return { r: channel(l), g: channel(l), b: channel(l) };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: channel(hueToChannel(p, q, h + 1 / 3)),
    g: channel(hueToChannel(p, q, h)),
    b: channel(hueToChannel(p, q, h - 1 / 3)),
  };
}

/**
 * The same hue, darkened one step at a time until it clears the floor against paper. Black
 * clears it at 21:1, so the walk always ends; a colour already readable comes back as it is.
 */
function readableOnPaper(brand: Rgb): string {
  let shade = brand;
  let { l } = toHsl(brand);
  const { h, s } = toHsl(brand);
  while (contrastRatio(toHex(shade), WHITE) < TEXT_CONTRAST_FLOOR) {
    l = Math.max(0, l - LIGHTNESS_STEP);
    shade = fromHsl({ h, s, l });
  }
  return toHex(shade);
}

export interface CompliantShades {
  /** The tenant's colour as given, normalised to `#RRGGBB` — for large decorative fills only. */
  readonly brand: string;
  /** The colour that may be a word on paper and a fill under white text: the brand, or its darkened shade. */
  readonly ink: string;
  /** Whether white text may sit on the raw brand colour; when not, a fill takes `ink`. */
  readonly whiteOnBrand: boolean;
}

/** The two questions `SCR-M01-18` asks of a brand colour, answered — never a refusal. */
export function compliantShades(brand: string): CompliantShades {
  const rgb = toRgb(brand);
  const normalised = toHex(rgb);
  return {
    brand: normalised,
    ink: readableOnPaper(rgb),
    whiteOnBrand: contrastRatio(WHITE, normalised) >= TEXT_CONTRAST_FLOOR,
  };
}
