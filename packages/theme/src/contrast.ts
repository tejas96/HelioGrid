/**
 * WCAG 2.x contrast gate, ported from the v1 package against the V2 colors.css.
 * Ratios are COMPUTED from resolved token values, never eyeballed; the build FAILS below
 * floor. Floors are set at the WCAG level each ROLE must keep clearing — never at the
 * measured value, which would weaken the gate to pass. The DS's own measured table lives in
 * src/_generated/tokens/colors.css; this gate re-derives it on every build so a re-pulled
 * colour cannot silently drop a pair under its floor.
 *
 * The maths below is `packages/domain`'s `branding/contrast.ts`, written out a second time
 * because this package depends on nothing in the workspace — it is generated from the
 * live design system and its build must run before any package is built. The two are one
 * formula: a change to WCAG's constants is a change to both files.
 *
 * Which pairs `packages/ui` actually draws is held by the `ui-colour-pairs` invariant: a colour
 * set on a background in one rule or style object fails it until its pair is declared below.
 */

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r as number) + 0.7152 * lin(g as number) + 0.0722 * lin(b as number);
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

interface DeclaredPair {
  fg: string;
  bg: string;
  role: string;
  /** Build FAILS when the computed ratio drops below this. */
  floor: number;
  /** Restricted-role annotation, carried as metadata for lint/review. */
  restriction?: string;
}

/** `fill` is the open page's grey: every field, tile and chip — the words in them land on it.
 *  `fill-hover` is a tappable tile under the web pointer: its words stay readable there. */
const TEXT_BACKGROUNDS = [
  'surface',
  'canvas',
  'surface-alt',
  'canvas-sunken',
  'fill',
  'fill-hover',
] as const;
const SEMANTIC = ['success', 'warning', 'danger', 'info', 'neutral'] as const;
/** --warning excluded: colors.css proves it clears 3:1 NOWHERE — it is a tint, never a mark. */
const MARKS = ['success', 'danger', 'info', 'neutral'] as const;
const MARK_BACKGROUNDS = ['surface', 'canvas', 'canvas-sunken', 'fill'] as const;

/**
 * The declared pair set. Word-setting tokens hold 4.5:1 (7:1 where the DS positions them as
 * AAA); marks hold WCAG's 3:1 non-text floor on every background a mark actually lands on —
 * white, canvas, sunken, and its own tint (a chip's dot sits on the tint, not the page).
 */
const DECLARED_PAIRS: DeclaredPair[] = [
  ...TEXT_BACKGROUNDS.map((bg) => ({
    fg: 'text-primary',
    bg,
    role: `headings and body (--text-heading) on --${bg}`,
    floor: 7,
  })),
  ...TEXT_BACKGROUNDS.map((bg) => ({
    fg: 'text-secondary',
    bg,
    role: `secondary text (--text-body) on --${bg}`,
    floor: 4.5,
    // On canvas-sunken and the state tints this pair is LOAD-BEARING: --text-tertiary
    // measures ≈4.54 on canvas-sunken (at the floor's edge), so quiet text steps up to --text-secondary.
  })),
  { fg: 'text-tertiary', bg: 'surface', role: 'meta text (--text-meta) on white', floor: 4.5 },
  { fg: 'text-tertiary', bg: 'canvas', role: 'meta text on page canvas', floor: 4.5 },
  // A placeholder in a field's well (F7-15); on the disabled well it steps up to --text-secondary.
  { fg: 'text-tertiary', bg: 'fill', role: 'a placeholder in a field well', floor: 4.5 },
  {
    fg: 'text-tertiary',
    bg: 'surface-alt',
    role: "meta text on a dropzone's alt surface",
    floor: 4.5,
  },
  {
    fg: 'text-tertiary',
    bg: 'neutral-bg',
    role: "a state message's glyph on its neutral disc (non-text)",
    floor: 3,
    restriction: 'RESTRICTED: a glyph only — words on a state tint take --text-secondary.',
  },
  // DELIBERATELY not declared: text-tertiary on canvas-sunken (≈4.54 — at the 4.5 floor's edge; F7-15).
  // colors.css: on sunken and on any state tint, quiet text takes --text-secondary instead.
  // Declaring it would sanction a pairing the design system forbids (colors.css), at the floor's edge.
  {
    fg: 'text-disabled',
    bg: 'surface',
    role: 'disabled control text',
    floor: 1,
    restriction:
      'RESTRICTED: ≈1.6:1. WCAG 1.4.3 exempts inactive controls; never words a user must ' +
      'read, and disabled state must never be the only signal.',
  },
  {
    fg: 'text-disabled',
    bg: 'canvas-sunken',
    role: 'disabled control text on the sunk disabled fill',
    floor: 1,
    restriction:
      'RESTRICTED: ≈1.4:1. WCAG 1.4.3 exempts inactive controls; never words a user must ' +
      'read, and disabled state must never be the only signal.',
  },
  {
    fg: 'text-inverse',
    bg: 'action-primary',
    role: 'primary button label (white on near-black)',
    floor: 7,
  },
  { fg: 'text-inverse', bg: 'accent', role: 'white label on accent control fill', floor: 4.5 },
  { fg: 'text-inverse', bg: 'accent-hover', role: 'white label on hovered accent', floor: 4.5 },
  { fg: 'accent', bg: 'surface', role: 'links / focus / selected on white', floor: 4.5 },
  { fg: 'accent', bg: 'canvas', role: 'links on page canvas', floor: 4.5 },
  { fg: 'accent', bg: 'canvas-sunken', role: 'focus ring in wells (non-text)', floor: 3 },
  { fg: 'accent', bg: 'fill', role: "a field's focus ring on its fill (non-text)", floor: 3 },
  {
    fg: 'accent',
    bg: 'fill-hover',
    role: "a selected tile's ring under the pointer (non-text)",
    floor: 3,
  },
  { fg: 'accent-hover', bg: 'surface', role: 'hovered links on white', floor: 4.5 },
  { fg: 'accent', bg: 'accent-subtle', role: 'selected words on the accent tint', floor: 4.5 },
  { fg: 'text-secondary', bg: 'neutral-bg', role: 'quiet words on the neutral tint', floor: 4.5 },
  { fg: 'neutral-text', bg: 'fill', role: 'neutral chip words on the control fill', floor: 4.5 },
  { fg: 'text-inverse', bg: 'danger-text', role: 'a destructive button label', floor: 4.5 },
  { fg: 'text-inverse', bg: 'text-primary', role: 'tooltip words on near-black', floor: 4.5 },
  ...(['success', 'warning-text', 'danger'] as const).map((s) => ({
    fg: 'text-inverse',
    bg: s,
    role: `a step's glyph on the ${s} disc (non-text)`,
    floor: 3,
    restriction: 'RESTRICTED: a tick or an exclamation only — never words.',
  })),
  ...SEMANTIC.map((s) => ({
    fg: `${s}-text`,
    bg: `${s}-bg`,
    role: `${s} words on the ${s} tint (chip, banner)`,
    floor: 4.5,
  })),
  ...SEMANTIC.map((s) => ({
    fg: `${s}-text`,
    bg: 'surface',
    role: `${s} words on white (inline status copy)`,
    floor: 4.5,
  })),
  ...MARKS.flatMap((s) => [
    ...MARK_BACKGROUNDS.map((bg) => ({
      fg: s,
      bg,
      role: `${s} mark (dot, bar, fill) on --${bg}`,
      floor: 3,
    })),
    { fg: s, bg: `${s}-bg`, role: `${s} mark on its own tint (chip dot)`, floor: 3 },
  ]),
  ...MARK_BACKGROUNDS.map((bg) => ({
    fg: 'mark-subtle',
    bg,
    role: `meaning-bearing quiet mark on --${bg}`,
    floor: 3,
  })),
  {
    fg: 'warning',
    bg: 'warning-bg',
    role: 'warning TINT relationship only — never a mark',
    floor: 1,
    restriction:
      'RESTRICTED: --warning measures ≈2:1 everywhere — colors.css rules it is NOT a mark ' +
      'and never was. Every warning mark (dot, bar, glyph, fill) takes --warning-text; ' +
      '--warning survives only as a tint beneath text or a wash no reading depends on.',
  },
];

interface ComputedPair extends DeclaredPair {
  fgValue: string;
  bgValue: string;
  ratio: number;
  passes: boolean;
}

export function computePairs(resolved: Map<string, string>): ComputedPair[] {
  return DECLARED_PAIRS.map((p) => {
    const fgValue = resolved.get(p.fg);
    const bgValue = resolved.get(p.bg);
    if (!fgValue || !bgValue)
      throw new Error(`contrast pair references unknown token: ${p.fg}/${p.bg}`);
    const ratio = Math.round(contrastRatio(fgValue, bgValue) * 100) / 100;
    return { ...p, fgValue, bgValue, ratio, passes: ratio >= p.floor };
  });
}
