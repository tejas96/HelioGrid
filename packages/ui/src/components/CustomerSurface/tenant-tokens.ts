import {
  bestTextOn,
  contrast,
  darkenToPass,
  NEAR_BLACK,
  normaliseHex,
  PAPER,
  parseHex,
  TEXT_FLOOR,
  toHex,
  WHITE,
} from '../../utils/color-contrast';
import type { TenantTokens } from './CustomerSurface.types';

const mixWhite = (hex: string, pct: number): string => {
  const c = parseHex(hex);
  if (!c) {
    return WHITE;
  }
  const k = pct / 100;
  return toHex({
    r: c.r + (255 - c.r) * k,
    g: c.g + (255 - c.g) * k,
    b: c.b + (255 - c.b) * k,
  });
};

const darken = (hex: string, pct: number): string => {
  const c = parseHex(hex);
  if (!c) {
    return hex;
  }
  const k = 1 - pct / 100;
  return toHex({ r: c.r * k, g: c.g * k, b: c.b * k });
};

/**
 * The tokens a tenant colour is allowed to reach, and what each one had to satisfy.
 *
 * Words and fills both take `ink`, never the raw colour: a mid-tone brand blue reads at 4.45:1
 * on paper, which is under the floor, and would put unreadable links on a customer's quote.
 */
export function tenantTokens(brandColor: string | undefined): TenantTokens | null {
  const brand = normaliseHex(brandColor);
  if (brand === null) {
    return null;
  }
  const onBrand = bestTextOn(brand);
  const paperRatio = contrast(brand, PAPER);
  const ink =
    paperRatio !== null && paperRatio >= TEXT_FLOOR
      ? brand
      : (darkenToPass(brand, TEXT_FLOOR)?.hex ?? NEAR_BLACK);
  /* The monogram's fill: the brand colour only if a text colour clears the floor on it. */
  const markPasses = onBrand?.passes === true;
  const markBg = markPasses ? brand : ink;
  const markOn = markPasses ? (onBrand?.color ?? WHITE) : WHITE;
  return {
    '--tenant-brand': brand,
    '--tenant-mark': markBg,
    '--tenant-mark-on': markOn,
    '--accent': ink,
    '--accent-hover': darken(ink, 12),
    '--accent-subtle': mixWhite(brand, 92),
    '--link': ink,
    '--link-hover': darken(ink, 12),
    '--focus-ring': ink,
    /* HelioGrid's iridescence is OUR identity, not the tenant's. On a tenant's page it would be
       a second brand competing with theirs, so it resolves to their colour instead. */
    '--gradient-brand': `linear-gradient(135deg, ${brand} 0%, ${mixWhite(brand, 28)} 100%)`,
    '--glow-brand': `radial-gradient(circle, ${mixWhite(brand, 70)} 0%, rgba(255,255,255,0) 72%)`,
  };
}
