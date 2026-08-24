/**
 * Mechanical parser for src/_generated/tokens/*.css — the files `ds:pull` writes from the
 * live design system (docs/engineering/17 §6). The CSS is the source of truth; manifest.json is NEVER
 * read for values (the v1 manifest snapshotted 1ms reduced-motion overrides as canonical —
 * exactly the drift this parser prevents). Media-query and attribute-scoped overrides are
 * captured separately and never replace the base :root declarations.
 */

export interface TokenDecl {
  name: string;
  value: string;
  kindHint?: string;
  sourceFile: string;
}

interface ParsedCss {
  /** Ordered declarations from top-level :root blocks only. */
  root: TokenDecl[];
  /** Overrides inside @media (prefers-reduced-motion) — metadata, never base values. */
  reducedMotion: TokenDecl[];
  /** Overrides inside :root[data-mode=…] — density mode, a component prop, not base values. */
  dataMode: TokenDecl[];
  /** Overrides inside [data-field-mode="on"] — the F7-16 high-contrast field mode. */
  fieldModeOn: TokenDecl[];
  /** The explicit restore scope inside [data-field-mode="off"]. */
  fieldModeOff: TokenDecl[];
  /** Raw @font-face blocks (fonts.css). */
  fontFaces: string[];
}

const DECL_RE = /--([A-Za-z0-9-]+)\s*:\s*([^;]+);(?:[ \t]*\/\*\s*@kind\s+([a-z]+)\s*\*\/)?/g;

function extractDecls(block: string, sourceFile: string): TokenDecl[] {
  const out: TokenDecl[] = [];
  for (const m of block.matchAll(DECL_RE)) {
    const name = m[1] as string;
    // A value may carry an inline comment BEFORE its semicolon (print.css does this once:
    // `--doc-lh:1.5 /* @kind other */;`) — strip it, or the emitted value smuggles the comment.
    const kindInValue = (m[2] as string).match(/\/\*\s*@kind\s+([a-z]+)\s*\*\//);
    const value = (m[2] as string).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    out.push({ name, value, kindHint: m[3] ?? kindInValue?.[1], sourceFile });
  }
  return out;
}

/** Split css into segments so :root blocks inside @media are not mistaken for top-level. */
export function parseCssFile(css: string, sourceFile: string): ParsedCss {
  const result: ParsedCss = {
    root: [],
    reducedMotion: [],
    dataMode: [],
    fieldModeOn: [],
    fieldModeOff: [],
    fontFaces: [],
  };

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

  // field-mode.css scopes on the ATTRIBUTE, not :root — the product sets it on <html> and a
  // preview pane sets it on a subtree. Declaration-only blocks, so first `}` closes them.
  for (const m of withoutMedia.matchAll(/\[data-field-mode="(on|off)"\]\s*\{([^}]*)\}/g)) {
    const decls = extractDecls(m[2] as string, sourceFile);
    if (m[1] === 'on') result.fieldModeOn.push(...decls);
    else result.fieldModeOff.push(...decls);
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

/** Parse a single box-shadow of the DS form "0 2px 8px rgba(16,24,40,0.05)". */
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
