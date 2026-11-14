import {
  compliantShades,
  normaliseHexColour,
  parseHexColour,
  toHexColour,
} from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { bestTextOn, contrast, TEXT_CONTRAST_FLOOR, WHITE } from '../../utils/color-contrast';
import type { TenantTokens } from './CustomerSurface.types';

const mixWhite = (hex: string, pct: number): string => {
  const c = parseHexColour(hex);
  if (!c) {
    return WHITE;
  }
  const k = pct / 100;
  return toHexColour({
    r: c.r + (255 - c.r) * k,
    g: c.g + (255 - c.g) * k,
    b: c.b + (255 - c.b) * k,
  });
};

const darken = (hex: string, pct: number): string => {
  const c = parseHexColour(hex);
  if (!c) {
    return hex;
  }
  const k = 1 - pct / 100;
  return toHexColour({ r: c.r * k, g: c.g * k, b: c.b * k });
};

/** One colour laid over another: `share` of `over`, the rest of `under`. */
const mix = (over: string, under: string, share: number): string => {
  const a = parseHexColour(over);
  const b = parseHexColour(under);
  if (!a || !b) {
    return under;
  }
  return toHexColour({
    r: a.r * share + b.r * (1 - share),
    g: a.g * share + b.g * (1 - share),
    b: a.b * share + b.b * (1 - share),
  });
};

/** How much of the tenant's colour its tint holds over the dark card: enough to read as theirs. */
const DARK_TINT_SHARE = 0.26;
/** Where the walk toward white starts for words on a dark ground, and how far each step goes. */
const DARK_WORDS_START = 45;
const DARK_WORDS_STEP = 5;
const WALK_END = 100;

/**
 * The tenant's colour lightened until it reads on a dark ground (`F5-81`, `T-F5-001`): the dark
 * scheme's counterpart of `ink`, which is the colour darkened until it reads on paper. White is
 * where the walk ends, so it always arrives.
 */
function readableOnDark(brand: string, ground: string): string {
  for (let white = DARK_WORDS_START; white < WALK_END; white += DARK_WORDS_STEP) {
    const shade = mixWhite(brand, white);
    if ((contrast(shade, ground) ?? 0) >= TEXT_CONTRAST_FLOOR) return shade;
  }
  return WHITE;
}

/** `ink` darkened further, where its own light tint would leave it under the text floor. */
function readableOnTint(ink: string, tint: string): string {
  let shade = ink;
  for (
    let step = 0;
    step < WALK_END && (contrast(shade, tint) ?? 0) < TEXT_CONTRAST_FLOOR;
    step += DARK_WORDS_STEP
  ) {
    shade = darken(shade, DARK_WORDS_STEP);
  }
  return shade;
}

/**
 * The tokens a tenant colour is allowed to reach, and what each one had to satisfy.
 *
 * Words and fills both take `ink`, never the raw colour: a mid-tone brand blue reads at 4.45:1
 * on paper, which is under the floor, and would put unreadable links on a customer's quote.
 */
export function tenantTokens(brandColor: string | undefined): TenantTokens | null {
  const brand = normaliseHexColour(brandColor);
  if (brand === null) {
    return null;
  }
  const onBrand = bestTextOn(brand);
  /* Words and fills take domain's shade walk, the one the server derives for the same colour. */
  const { ink } = compliantShades(brand);
  /* The monogram's fill: the brand colour only if a text colour clears the floor on it. */
  const markPasses = onBrand?.passes === true;
  const markBg = markPasses ? brand : ink;
  const markOn = markPasses ? (onBrand?.color ?? WHITE) : WHITE;
  const tint = mixWhite(brand, 92);
  /* The dark scheme's own tint and words, derived as the light ones are (`T-F5-001`): the light
     tint alone drew white tiles on a dark phone. `CustomerSurface.css` puts them in force there. */
  const darkCard = theme.palettes.dark.surface;
  const darkTint = mix(brand, darkCard, DARK_TINT_SHARE);
  return {
    '--tenant-brand': brand,
    '--tenant-mark': markBg,
    '--tenant-mark-on': markOn,
    '--accent': ink,
    '--accent-hover': darken(ink, 12),
    '--accent-subtle': tint,
    '--accent-text': readableOnTint(ink, tint),
    '--tenant-dark-accent-subtle': darkTint,
    '--tenant-dark-accent-text': readableOnDark(brand, darkTint),
    '--tenant-dark-link': readableOnDark(brand, darkCard),
    '--link': ink,
    '--link-hover': darken(ink, 12),
    '--focus-ring': ink,
    /* HelioGrid's iridescence is OUR identity, not the tenant's. On a tenant's page it would be
       a second brand competing with theirs, so it resolves to their colour instead. */
    '--gradient-brand': `linear-gradient(135deg, ${brand} 0%, ${mixWhite(brand, 28)} 100%)`,
    '--glow-brand': `radial-gradient(circle, ${mixWhite(brand, 70)} 0%, rgba(255,255,255,0) 72%)`,
  };
}
