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
    floor: 4.5,
    // Ruling C's "borderline ≈4.45:1" restriction is RETIRED, not relaxed: ext 6 darkened the
    // token to #686C71 (≈5.28:1), so the caveat it carried no longer describes anything.
  },
  {
    fg: 'text-secondary',
    bg: 'canvas-sunken',
    role: 'SegmentedControl inactive label; supporting text in wells',
    floor: 4.5,
    // Was ≈3.89:1 and undeclared — docs/13 UXG-A11Y-03, found by hand because the background
    // comes from an ancestor rule the coverage scan cannot see. Declared now so it is checked.
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
    floor: 4.5,
    // Ruling C's sub-AA annotation is RETIRED: ext 6 darkened --danger to #D34247 (≈4.53:1),
    // so error copy now clears AA as ordinary text. It still pairs with an icon or field ring
    // — that is the never-colour-alone rule, which is about perception, not contrast.
  },
  {
    fg: 'danger',
    bg: 'danger-bg',
    role: 'danger chip',
    floor: 3,
    restriction:
      'Measures ≈3.96:1 after ext 6 (was ≈3.41:1). Below 4.5:1, which is legitimate here and only here: chip text is 13px medium ALWAYS accompanied by a label, and SC 1.4.11 governs the chip as a UI component. Do not reuse this pair for running text.',
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
  // ── Added 2026-07-30 by the coverage derivation below, which found these in use but
  // undeclared (therefore UNCHECKED). Each floor is set by the ROLE's WCAG requirement,
  // never by the measured number — see the restriction notes where the two disagree.
  {
    fg: 'accent',
    bg: 'accent-subtle',
    role: 'accent chip / avatar initials on accent tint',
    floor: 4.5,
  },
  {
    fg: 'surface',
    bg: 'danger',
    role: 'destructive button label (white on danger fill)',
    floor: 4.5,
    // CLOSED (docs/13 UXG-A11Y-02): ext 6 took this from ≈3.91:1 to ≈4.53:1, so the label
    // clears SC 1.4.3 as ordinary text at 15px/500 and needs no allowance to excuse it.
  },
  {
    fg: 'text-disabled',
    bg: 'canvas-sunken',
    role: 'disabled control text and icons',
    floor: 1,
    restriction:
      'Measures ≈1.44:1. WCAG 1.4.3 exempts inactive/disabled controls from contrast minima, so this is compliant by exemption, not by ratio. Disabled state must never be the ONLY signal — controls also carry disabled semantics for assistive tech.',
  },
];

// NOT declared, deliberately: --text-secondary on --canvas-sunken (≈3.89:1). The ds-source
// reference used it for the AvatarGroup "+N" count, which failed WCAG AA for meaning-bearing
// caption text; both platforms now use --text-primary there (docs/13 UXG-A11Y-01, CLOSED).
// Declaring the pair would sanction a sub-AA combination nobody needs — leaving it out means
// the coverage gate below fails the build if any component reaches for it again.

/**
 * Pairings the per-rule scan reports that are NOT real foreground/background pairings.
 *
 * Same shape as `GLOBAL_TABLES` in the tenancy scan and `NO_CONTRACT_YET` in enum parity:
 * an explicit allowlist with a reason per entry, so an exemption is a recorded decision
 * rather than a silent hole. Every entry here is the SAME artifact: a component declares an
 * icon-stroke `color:` in a base rule whose `background:` belongs to the INACTIVE state,
 * and the icon is hidden (`opacity: 0`) until a state change also flips the background. The
 * pairing the user actually sees is the state rule's background, which is declared above.
 */
const NOT_A_PAIRING: { fg: string; bg: string; reason: string }[] = [
  {
    fg: 'surface',
    bg: 'surface',
    reason:
      'Checkbox.css: the check stroke is --surface and the UNCHECKED box is also --surface; the stroke only becomes visible when [data-state="checked"] sets background:--accent. A token against itself is 1:1 by definition — never a real pairing.',
  },
  {
    fg: 'surface',
    bg: 'canvas-sunken',
    reason:
      'RadioCard.css: the indicator svg is opacity:0 while the indicator background is --canvas-sunken; checking it sets background:--accent AND opacity:1. The visible pairing is surface-on-accent (declared).',
  },
];

/**
 * Coverage derivation.
 *
 * DECLARED_PAIRS is hand-curated, so a component using a fg/bg combination nobody declared
 * is simply UNCHECKED — the gate under-covers silently as packages/ui grows. This scans the
 * component CSS for rules that set BOTH a colour and a background from tokens and reports
 * any pairing that is neither declared nor an acknowledged non-pairing.
 *
 * SCOPE — a real limit, not a hypothetical one. This sees ONE CSS rule at a time, so a
 * pairing whose background comes from an ancestor is invisible to it. Proven example:
 * `.ui-segmented` sets the track `background: var(--canvas-sunken)` while
 * `.ui-segmented-item` sets `background: transparent` plus the label colour — no single rule
 * pairs them, so the gate passes while the inactive label sits at ≈3.89:1 (docs/13
 * UXG-A11Y-03, found by hand). It also does not read React Native at all (apps/mobile styles
 * from theme.ts objects), and `effectiveToken` resolves `var()` fallbacks and `color-mix()`
 * by position rather than by evaluating them. A firing is therefore a genuine finding; GREEN
 * IS NOT A PROOF OF TOTAL COVERAGE, and effective-background review stays a `ux-lens` job.
 */
/**
 * The token a declaration actually renders with — the LAST `--name` in its value.
 *
 * The old pattern demanded `var(--name)` with the paren closing right after, so it SKIPPED
 * (not flagged — skipped) the two shapes packages/ui/CLAUDE.md sanctions: `var(--x, fallback)`
 * and `color-mix()`. `.ui-icon-circle` in Card.css uses both at once and was invisible.
 *
 * Last, not first, because that is what renders by default in each shape:
 *   var(--ui-icon-circle-color, var(--accent))            → accent  (end of the fallback
 *     chain is the value when no caller sets the component property)
 *   color-mix(in srgb, var(--accent) 6%, var(--surface))  → surface (the 94% component)
 * HEURISTIC, and stated as one: percentages are not parsed, so a mix weighted the other way
 * (`var(--a) 90%, var(--b)`) would resolve to the minority token. Every current use in
 * packages/ui puts the dominant colour last. Reporting the wrong-but-close token is a finding
 * someone reads; skipping the rule entirely was silence.
 */
function effectiveToken(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const tokens = [...value.matchAll(/--([a-z0-9-]+)/gi)].map((m) => m[1] as string);
  return tokens.at(-1);
}

/**
 * The token a PROPERTY finally renders with, across every declaration of it in one rule.
 * `background: transparent; background-color: var(--surface)` must resolve to `surface`, not
 * to nothing — taking only the first declaration made a reset silence the whole rule.
 */
function lastToken(body: string, decl: RegExp): string | undefined {
  return [...body.matchAll(decl)]
    .map((m) => effectiveToken(m[1]))
    .filter((t): t is string => Boolean(t))
    .at(-1);
}

export function findUndeclaredPairs(cssFiles: { path: string; text: string }[]): string[] {
  const undeclared = new Set<string>();
  // DECLARED_PAIRS names tokens bare ('text-primary'); CSS writes them as var(--text-primary).
  // Strip the leading `--` so the two vocabularies actually meet — comparing them unstripped
  // silently marks EVERY pairing undeclared, which reads as a broken gate, not a finding.
  const declared = new Set(DECLARED_PAIRS.map((p) => `${p.fg}|${p.bg}`));
  const exempt = new Set(NOT_A_PAIRING.map((p) => `${p.fg}|${p.bg}`));

  for (const { path, text } of cssFiles) {
    // Each rule body: capture colour and background-colour token references together.
    for (const block of text.matchAll(/\{([^}]*)\}/g)) {
      const body = block[1] as string;
      // ALL matching declarations, last one that yields a token — not the first declaration
      // outright. A rule that resets then sets (`background: transparent;
      // background-color: var(--surface)`) gave `transparent` on the first match, resolved to
      // no token, and the whole rule was skipped — silently UNCHECKING a pairing the stricter
      // old regex had caught. Last also matches CSS cascade order within a rule.
      const fg = lastToken(body, /(?:^|[;\s])color:\s*([^;]+)/gi);
      const bg = lastToken(body, /(?:^|[;\s])background(?:-color)?:\s*([^;]+)/gi);
      if (!fg || !bg) continue;
      const key = `${fg}|${bg}`;
      if (declared.has(key) || exempt.has(key)) continue;
      undeclared.add(`--${fg} on --${bg}  (${path})`);
    }
  }
  return [...undeclared].sort();
}

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
