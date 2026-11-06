import type { ColorToken, ThemePalette } from './tokens/colors';

/**
 * The WCAG 2.x contrast pairs the interface draws, each with the floor its role must keep. Floors
 * are set at the level a role needs, never at a measured value. `tests/contrast.test.ts` measures
 * every pair in light, dark and field mode, and a planted bad pair fails it.
 *
 * The maths is `packages/domain`'s `branding/contrast.ts` written out a second time, because this
 * package depends on nothing in the workspace. A change to WCAG's constants is a change to both.
 *
 * Which pairs `packages/ui` actually draws is held by the `ui-colour-pairs` invariant: a colour set
 * on a background in one rule or style object fails it until its pair is declared here.
 */
function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r as number) + 0.7152 * lin(g as number) + 0.0722 * lin(b as number);
}

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export interface DeclaredPair {
  readonly fg: ColorToken;
  readonly bg: ColorToken;
  readonly role: string;
  /** The ratio this pair must keep in every mode. */
  readonly floor: number;
  /** A restricted role, carried as metadata for review. */
  readonly restriction?: string;
}

const TEXT_BACKGROUNDS = [
  'surface',
  'canvas',
  'surface-alt',
  'fill',
  'fill-hover',
] as const satisfies readonly ColorToken[];
const SEMANTIC = ['success', 'warning', 'danger', 'info', 'neutral'] as const;
const MARK_BACKGROUNDS = [
  'surface',
  'canvas',
  'canvas-sunken',
  'fill',
] as const satisfies readonly ColorToken[];

export const DECLARED_PAIRS: readonly DeclaredPair[] = [
  ...[...TEXT_BACKGROUNDS, 'canvas-sunken' as const].map((bg) => ({
    fg: 'text-primary' as const,
    bg,
    role: `headings and body on --${bg}`,
    floor: 7,
  })),
  ...[...TEXT_BACKGROUNDS, 'canvas-sunken' as const].map((bg) => ({
    fg: 'text-secondary' as const,
    bg,
    role: `secondary text on --${bg}`,
    floor: 4.5,
  })),
  ...(['surface', 'canvas', 'fill', 'surface-alt'] as const).map((bg) => ({
    fg: 'text-tertiary' as const,
    bg,
    role: `meta text and placeholders on --${bg}`,
    floor: 4.5,
  })),
  {
    fg: 'text-tertiary',
    bg: 'neutral-bg',
    role: "a state message's glyph on its neutral disc (non-text)",
    floor: 3,
    restriction: 'a glyph only — words on a state tint take --text-secondary',
  },
  {
    fg: 'text-disabled',
    bg: 'surface',
    role: 'disabled control text',
    floor: 1,
    restriction: 'WCAG 1.4.3 exempts inactive controls; never words a user must read',
  },
  {
    fg: 'text-disabled',
    bg: 'canvas-sunken',
    role: 'disabled control text on the sunk fill',
    floor: 1,
    restriction: 'WCAG 1.4.3 exempts inactive controls; never words a user must read',
  },
  { fg: 'text-inverse', bg: 'action-primary', role: 'the primary button label', floor: 4.5 },
  { fg: 'text-inverse', bg: 'action-primary-hover', role: 'a hovered primary label', floor: 4.5 },
  { fg: 'text-inverse', bg: 'action-primary-pressed', role: 'a pressed primary label', floor: 4.5 },
  { fg: 'text-inverse', bg: 'accent', role: 'a label on an accent control fill', floor: 4.5 },
  { fg: 'text-inverse', bg: 'accent-hover', role: 'a label on a hovered accent', floor: 4.5 },
  { fg: 'on-ink', bg: 'ink', role: 'the active nav item and a tooltip', floor: 7 },
  { fg: 'accent', bg: 'surface', role: 'links, focus and selection on a card', floor: 4.5 },
  { fg: 'accent', bg: 'canvas', role: 'links on the page', floor: 4.5 },
  { fg: 'accent', bg: 'canvas-sunken', role: 'a focus ring in a well (non-text)', floor: 3 },
  { fg: 'accent', bg: 'fill', role: "a field's focus ring on its fill (non-text)", floor: 3 },
  {
    fg: 'accent',
    bg: 'fill-hover',
    role: 'a selected ring under the pointer (non-text)',
    floor: 3,
  },
  { fg: 'accent-hover', bg: 'surface', role: 'a hovered link on a card', floor: 4.5 },
  { fg: 'accent-text', bg: 'accent-subtle', role: 'selected words on the accent tint', floor: 4.5 },
  { fg: 'accent', bg: 'accent-subtle', role: 'a selected mark on the accent tint', floor: 3 },
  { fg: 'text-secondary', bg: 'neutral-bg', role: 'quiet words on the neutral tint', floor: 4.5 },
  { fg: 'neutral-text', bg: 'fill', role: 'neutral chip words on the control fill', floor: 4.5 },
  { fg: 'text-inverse', bg: 'danger-text', role: 'a destructive button label', floor: 4.5 },
  { fg: 'text-inverse', bg: 'text-primary', role: 'words on the ink fill', floor: 4.5 },
  { fg: 'line-strong', bg: 'surface', role: "a field's resting outline (non-text)", floor: 1.4 },
  { fg: 'on-panel', bg: 'panel', role: 'hero figures and words on the solar glass', floor: 7 },
  { fg: 'on-panel', bg: 'panel-deep', role: 'hero words at the glass deep end', floor: 7 },
  { fg: 'on-panel-muted', bg: 'panel', role: 'hero labels on the solar glass', floor: 4.5 },
  { fg: 'on-panel-muted', bg: 'panel-deep', role: 'hero labels at the deep end', floor: 4.5 },
  ...(['success', 'warning-text', 'danger'] as const).map((s) => ({
    fg: 'text-inverse' as const,
    bg: s,
    role: `a step's glyph on the ${s} disc (non-text)`,
    floor: 3,
    restriction: 'a tick or an exclamation only — never words',
  })),
  ...SEMANTIC.flatMap((s) => [
    {
      fg: `${s}-text` as const,
      bg: `${s}-bg` as const,
      role: `${s} words on its tint`,
      floor: 4.5,
    },
    { fg: `${s}-text` as const, bg: 'surface' as const, role: `${s} words on a card`, floor: 4.5 },
    { fg: `${s}-text` as const, bg: 'canvas' as const, role: `${s} words on the page`, floor: 4.5 },
    { fg: s, bg: `${s}-bg` as const, role: `${s} mark on its own tint (a chip's dot)`, floor: 3 },
    ...MARK_BACKGROUNDS.map((bg) => ({
      fg: s,
      bg,
      role: `${s} mark (dot, bar, fill) on --${bg}`,
      floor: 3,
    })),
  ]),
  ...(['ocean', 'teal', 'plum'] as const).flatMap((h) => [
    {
      fg: `hue-${h}-text` as const,
      bg: `hue-${h}-bg` as const,
      role: `${h} words on its wash`,
      floor: 4.5,
    },
    {
      fg: `hue-${h}-text` as const,
      bg: 'surface' as const,
      role: `${h} words on a card`,
      floor: 4.5,
    },
    { fg: `hue-${h}` as const, bg: 'surface' as const, role: `${h} mark on a card`, floor: 3 },
    {
      fg: `hue-${h}` as const,
      bg: `hue-${h}-bg` as const,
      role: `${h} mark on its wash`,
      floor: 3,
    },
  ]),
  ...MARK_BACKGROUNDS.map((bg) => ({
    fg: 'mark-subtle' as const,
    bg,
    role: `a quiet mark that carries meaning on --${bg}`,
    floor: 3,
  })),
];

export interface MeasuredPair extends DeclaredPair {
  readonly fgValue: string;
  readonly bgValue: string;
  readonly ratio: number;
  readonly passes: boolean;
}

/** Every declared pair measured in one palette. A token that is not one opaque hex is refused. */
export function measurePairs(
  palette: ThemePalette,
  pairs: readonly DeclaredPair[] = DECLARED_PAIRS,
): MeasuredPair[] {
  return pairs.map((p) => {
    const fgValue = palette[p.fg];
    const bgValue = palette[p.bg];
    for (const v of [fgValue, bgValue]) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(v))
        throw new Error(`pair ${p.fg}/${p.bg} names ${v}, not a hex`);
    }
    const ratio = Math.round(contrastRatio(fgValue, bgValue) * 100) / 100;
    return { ...p, fgValue, bgValue, ratio, passes: ratio >= p.floor };
  });
}
