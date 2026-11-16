import { parseHexColour, toHexColour } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { createContext, useContext } from 'react';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import type { ProposalBlockMode } from './ProposalBlocks.types';

/**
 * The colours a block draws with. In the builder and on the customer's page they are the theme's
 * own, following light and dark. On paper they are the LIGHT palette's, fixed — a page prints on
 * white whatever scheme the phone is in — and on the document's deep page they are that page's own
 * light inks. The web half gets all three from the cascade (`[data-paper]`, `data-tone`); a phone
 * has no cascade, so the page hands its ink down here.
 */
export interface BlockInk {
  readonly text: ThemeColor;
  readonly secondary: ThemeColor;
  readonly tertiary: ThemeColor;
  readonly lineSoft: ThemeColor;
  readonly lineStrong: ThemeColor;
  readonly hairline: ThemeColor;
  readonly fill: ThemeColor;
  /** What a ring is cut out of: the page the block stands on. */
  readonly ground: ThemeColor;
  readonly track: ThemeColor;
  readonly markSubtle: ThemeColor;
  readonly accent: ThemeColor;
  readonly accentSubtle: ThemeColor;
  readonly accentText: ThemeColor;
  readonly chart1: ThemeColor;
  readonly chart2: ThemeColor;
  readonly sun: ThemeColor;
  readonly successBg: ThemeColor;
  readonly successText: ThemeColor;
  /** A derived figure's tier mark (`Provenance.tiers.ts` `TIER_MARK`). */
  readonly infoText: ThemeColor;
  readonly warning: ThemeColor;
  readonly warningBg: ThemeColor;
  readonly warningText: ThemeColor;
  readonly danger: ThemeColor;
  readonly dangerBg: ThemeColor;
  readonly dangerText: ThemeColor;
  readonly neutralBg: ThemeColor;
  readonly neutralText: ThemeColor;
  readonly actionPrimary: ThemeColor;
  readonly inverse: ThemeColor;
}

type Palette = Readonly<Record<keyof typeof theme.palettes.light, ThemeColor>>;

function inkFrom(palette: Palette): BlockInk {
  return {
    text: palette['text-primary'],
    secondary: palette['text-secondary'],
    tertiary: palette['text-tertiary'],
    lineSoft: palette['line-soft'],
    lineStrong: palette['line-strong'],
    hairline: palette.hairline,
    fill: palette.fill,
    ground: palette.surface,
    track: palette['canvas-sunken'],
    markSubtle: palette['mark-subtle'],
    accent: palette.accent,
    accentSubtle: palette['accent-subtle'],
    accentText: palette['accent-text'],
    chart1: palette['chart-1'],
    chart2: palette['chart-2'],
    sun: palette.sun,
    successBg: palette['success-bg'],
    successText: palette['success-text'],
    infoText: palette['info-text'],
    warning: palette.warning,
    warningBg: palette['warning-bg'],
    warningText: palette['warning-text'],
    danger: palette.danger,
    dangerBg: palette['danger-bg'],
    dangerText: palette['danger-text'],
    neutralBg: palette['neutral-bg'],
    neutralText: palette['neutral-text'],
    actionPrimary: palette['action-primary'],
    inverse: palette['text-inverse'],
  };
}

const LIGHT = theme.palettes.light;

/** One colour let through over another, as `color-mix` does on the web — in the light palette's hex. */
export function mixHex(over: string, under: string, share: number): string {
  const a = parseHexColour(over);
  const b = parseHexColour(under);
  if (a === null || b === null) return over;
  const part = (x: number, y: number) => x * share + y * (1 - share);
  return toHexColour({ r: part(a.r, b.r), g: part(a.g, b.g), b: part(a.b, b.b) });
}

/** A light-palette colour let through at a share of its strength — a wash, a shade. */
export function withAlpha(hex: string, alpha: number): string {
  const colour = parseHexColour(hex);
  if (colour === null) return hex;
  return `rgba(${colour.r}, ${colour.g}, ${colour.b}, ${alpha})`;
}

/** The deep page's ground, as the web half mixes it. */
export const DEEP_GROUND: string = mixHex(LIGHT['brand-ocean'], LIGHT.ink, 0.62);

const onDeep = (share: number): string => mixHex(LIGHT['text-inverse'], DEEP_GROUND, share);

const SCREEN_INK: BlockInk = inkFrom(colors);
const PAPER_INK: BlockInk = inkFrom(LIGHT);
const DEEP_INK: BlockInk = {
  ...PAPER_INK,
  text: LIGHT['text-inverse'],
  secondary: onDeep(0.8),
  tertiary: onDeep(0.66),
  lineSoft: onDeep(0.18),
  lineStrong: onDeep(0.4),
  hairline: onDeep(0.14),
  fill: onDeep(0.1),
  ground: DEEP_GROUND,
  track: onDeep(0.14),
  markSubtle: onDeep(0.55),
  chart1: mixHex(LIGHT['brand-teal'], LIGHT['text-inverse'], 0.46),
  chart2: mixHex(
    mixHex(LIGHT['brand-green'], LIGHT['brand-teal'], 0.3),
    LIGHT['text-inverse'],
    0.6,
  ),
  warning: LIGHT.sun,
  warningText: LIGHT.sun,
};

/** What a page hands its blocks: its tone, and the tenant's compliant shade where it carries one. */
export interface PaperScope {
  readonly tone: 'plain' | 'deep';
  readonly accent?: { readonly ink: string; readonly subtle: string; readonly text: string };
}

export const PaperScopeContext = createContext<PaperScope>({ tone: 'plain' });

/** The ink a block draws with, for its mode and the page it stands on. */
export function useBlockInk(mode: ProposalBlockMode): BlockInk {
  const scope = useContext(PaperScopeContext);
  if (mode !== 'paper') return SCREEN_INK;
  const ink = scope.tone === 'deep' ? DEEP_INK : PAPER_INK;
  if (scope.accent === undefined) return ink;
  return {
    ...ink,
    accent: scope.accent.ink,
    accentSubtle: scope.accent.subtle,
    accentText: scope.accent.text,
  };
}

/** A tile's wash and ink on paper, in the light palette: a hue's pair, or a tone's. */
export function paperTileTint(hue: 'ocean' | 'teal' | 'plum' | 'success' | 'neutral' | 'danger'): {
  readonly bg: string;
  readonly fg: string;
} {
  if (hue === 'ocean' || hue === 'teal' || hue === 'plum') {
    return { bg: LIGHT[`hue-${hue}-bg`], fg: LIGHT[`hue-${hue}-text`] };
  }
  return { bg: LIGHT[`${hue}-bg`], fg: LIGHT[`${hue}-text`] };
}
