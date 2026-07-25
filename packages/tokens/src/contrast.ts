/**
 * WCAG 2.x contrast engine — extension 5 of docs/10 §2.
 * Ratios are COMPUTED from resolved token values, never eyeballed; the build fails
 * below floor. Restricted-role annotations are ruling C (docs/10 §3.2) baked in.
 */

export function relativeLuminance(hex: string): number {
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

export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export interface DeclaredPair {
  fg: string;
  bg: string;
  role: string;
  /** Build FAILS when the computed ratio drops below this. */
  floor: number;
  /** Ruling C restricted-role annotation, carried as metadata for lint/review. */
  restriction?: string;
}

/**
 * The declared pair set. Floors are set at the WCAG level each role must keep clearing;
 * restricted roles (ruling C) keep their hex but carry the constraint as metadata.
 */
export const DECLARED_PAIRS: DeclaredPair[] = [
  { fg: 'text-primary', bg: 'surface', role: 'body text on cards', floor: 7 },
  { fg: 'text-primary', bg: 'canvas', role: 'body text on page canvas', floor: 7 },
  { fg: 'text-primary', bg: 'surface-alt', role: 'body text on zebra rows', floor: 7 },
  { fg: 'text-primary', bg: 'canvas-sunken', role: 'body text in wells', floor: 7 },
  {
    fg: 'text-secondary',
    bg: 'surface',
    role: 'secondary text; meaning-bearing overlines',
    floor: 4.3,
    restriction:
      'Borderline ≈4.45:1 (ruling C) — body copy on surface uses --text-primary; secondary is for supporting text only.',
  },
  {
    fg: 'text-tertiary',
    bg: 'surface',
    role: 'decorative/timestamps ONLY',
    floor: 1,
    restriction:
      'RESTRICTED (ruling C): ≈2.5:1 — never load-bearing text. Meaning-bearing overlines use --text-secondary.',
  },
  {
    fg: 'surface',
    bg: 'action-primary',
    role: 'primary button label (white on near-black)',
    floor: 7,
  },
  { fg: 'surface', bg: 'accent', role: 'white label on accent control fills', floor: 4.5 },
  { fg: 'accent', bg: 'surface', role: 'links / focus ring on white', floor: 4.5 },
  { fg: 'accent', bg: 'canvas', role: 'links on page canvas', floor: 4.3 },
  {
    fg: 'danger',
    bg: 'surface',
    role: 'error text / destructive labels',
    floor: 3.8,
    restriction:
      'Measures ≈3.9:1 (ds-source value) — clears WCAG AA for large text/UI components (≥3:1), not 4.5:1 body. Error copy pairs with an icon/field ring, never colour alone.',
  },
  {
    fg: 'danger',
    bg: 'danger-bg',
    role: 'danger chip',
    floor: 3,
    restriction: 'Measures ≈3.4:1 — chip text is 13px medium with a label, never colour alone.',
  },
  { fg: 'success', bg: 'success-bg', role: 'success chip', floor: 3 },
  { fg: 'info', bg: 'info-bg', role: 'info chip', floor: 3 },
  { fg: 'neutral', bg: 'neutral-bg', role: 'neutral chip', floor: 3.5 },
  {
    fg: 'warning',
    bg: 'warning-bg',
    role: 'warning chip ONLY',
    floor: 1,
    restriction:
      'RESTRICTED (ruling C): --warning ≈2.2:1 as text — always sits on --warning-bg with a label, never bare foreground text.',
  },
];

export interface ComputedPair extends DeclaredPair {
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
