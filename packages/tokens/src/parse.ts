/**
 * Mechanical parser for design/ds-source/tokens/*.css.
 * The vendored CSS is the source of truth (docs/10 §1); _ds_manifest.json is NEVER read —
 * it snapshotted the 1ms reduced-motion overrides as canonical values, which is exactly
 * the drift this parser exists to prevent: media-query overrides are captured separately
 * and never replace the base :root declarations.
 */

export interface TokenDecl {
  name: string;
  value: string;
  kindHint?: string;
  sourceFile: string;
}

export interface ParsedCss {
  /** Ordered declarations from top-level :root blocks only. */
  root: TokenDecl[];
  /** Overrides inside @media (prefers-reduced-motion) — metadata, never base values. */
  reducedMotion: TokenDecl[];
  /** Overrides inside :root[data-mode=…] — a no-op placeholder in ds-source (docs/10 §4). */
  dataMode: TokenDecl[];
  /** Raw @font-face blocks (fonts.css). */
  fontFaces: string[];
}

const DECL_RE = /--([A-Za-z0-9-]+)\s*:\s*([^;]+);(?:[ \t]*\/\*\s*@kind\s+([a-z]+)\s*\*\/)?/g;

function extractDecls(block: string, sourceFile: string): TokenDecl[] {
  const out: TokenDecl[] = [];
  for (const m of block.matchAll(DECL_RE)) {
    const name = m[1] as string;
    const value = (m[2] as string).trim();
    out.push({ name, value, kindHint: m[3], sourceFile });
  }
  return out;
}

/** Split css into segments so :root blocks inside @media are not mistaken for top-level. */
export function parseCssFile(css: string, sourceFile: string): ParsedCss {
  const result: ParsedCss = { root: [], reducedMotion: [], dataMode: [], fontFaces: [] };

  for (const m of css.matchAll(/@font-face\s*\{[^}]*\}/g)) {
    result.fontFaces.push(m[0]);
  }

  const media = css.match(/@media\s*\(prefers-reduced-motion[^)]*\)\s*\{([\s\S]*?)\}\s*\}/);
  const mediaInner = media ? `${media[1]}}` : '';
  if (mediaInner) result.reducedMotion = extractDecls(mediaInner, sourceFile);
  const withoutMedia = media ? css.replace(media[0], '') : css;

  for (const m of withoutMedia.matchAll(/:root(\[[^\]]*\])?\s*\{([\s\S]*?)\}/g)) {
    const selectorAttr = m[1];
    const body = m[2] as string;
    if (selectorAttr) result.dataMode.push(...extractDecls(body, sourceFile));
    else result.root.push(...extractDecls(body, sourceFile));
  }
  return result;
}

/** Longest alias chain we will follow before calling it a cycle. */
const MAX_VAR_HOPS = 20;

/** Resolve var(--x) chains against a token map (aliases → raw values). */
export function resolveValue(value: string, map: Map<string, string>): string {
  const re = /var\(\s*--([A-Za-z0-9-]+)\s*\)/;
  let out = value;
  let m = out.match(re);
  // A local counter, not a parameter: the only caller never passed one, and the previous
  // version checked two different limits (10 on entry, 20 in the loop) for one concept.
  let hops = 0;
  while (m) {
    const target = map.get(m[1] as string);
    if (target === undefined) throw new Error(`Unresolvable var(--${m[1]}) in "${value}"`);
    out = out.replace(m[0], target);
    m = out.match(re);
    hops += 1;
    if (hops > MAX_VAR_HOPS) throw new Error(`var() resolution loop at: ${value}`);
  }
  return out;
}

export function pxToNumber(v: string): number | undefined {
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)px$/);
  return m ? Number(m[1]) : v.trim() === '0' ? 0 : undefined;
}

export interface ParsedShadow {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
  opacity: number;
}

/** Parse single box-shadow of the ds-source form "0 2px 8px rgba(16,24,40,0.05)". */
export function parseShadow(v: string): ParsedShadow | null {
  if (v.trim() === 'none') return null;
  const m = v
    .trim()
    .match(/^(-?\d+)(?:px)?\s+(-?\d+)px\s+(\d+)px\s+rgba\((\d+),(\d+),(\d+),([0-9.]+)\)$/);
  if (!m) throw new Error(`Unparseable shadow: ${v}`);
  const [r, g, b] = [Number(m[4]), Number(m[5]), Number(m[6])];
  const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  return {
    offsetX: Number(m[1]),
    offsetY: Number(m[2]),
    blurRadius: Number(m[3]),
    color: hex,
    opacity: Number(m[7]),
  };
}
