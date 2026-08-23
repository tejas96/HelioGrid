/**
 * packages/theme generator — docs/17 §2/§6, the canonical mechanism.
 *
 * Parses src/_generated/tokens/*.css (written by ds:pull from the live design system,
 * project c8aa4326-21bf-453a-8d11-749cc81dee12) and emits:
 *   dist/tokens.css           fonts (url-rewritten) + token files in the DS's order + base
 *   dist/base.css             the DS global stylesheet (styles.css with its imports inlined)
 *   dist/print.css            the print surface — verbatim; @page presence is asserted
 *   dist/theme.ts             RN theme object (compiled to .js/.d.ts by tsc -p tsconfig.emit.json)
 *   dist/index.ts             package entry re-exporting the theme (compiled the same way)
 *   dist/tokens.json          flat --name → resolved value map of every custom property
 *   dist/contrast.pairs.json  computed WCAG ratios — build FAILS below floor
 *   dist/fonts/*              vendored woff2 (Geist, Geist Mono, Noto Sans Devanagari)
 *
 * NEVER hand-transcribe values. NEVER read manifest.json for values (the v1 manifest
 * snapshotted 1ms reduced-motion overrides as canonical — the drift this generator prevents).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePairs } from './src/contrast';
import { buildThemeObject, renderThemeTs } from './src/emit-theme';
import { parseCssFile, resolveValue, type TokenDecl } from './src/parse';

const pkgDir = dirname(fileURLToPath(import.meta.url));
const genDir = join(pkgDir, 'src', '_generated');
const tokensDir = join(genDir, 'tokens');
const distDir = join(pkgDir, 'dist');
const FONTS = ['Geist[wght].woff2', 'GeistMono[wght].woff2', 'NotoSansDevanagari[wght].woff2'];

/** The 11 pulled files — refuse to emit if the pull is incomplete. */
const ALL_FILES = [
  'base.css',
  'colors.css',
  'elevation.css',
  'field-mode.css',
  'fonts.css',
  'keyframes.css',
  'motion.css',
  'print.css',
  'radius.css',
  'spacing.css',
  'typography.css',
] as const;

/** Files carrying top-level :root custom properties. */
const DECL_FILES = [
  'colors.css',
  'typography.css',
  'spacing.css',
  'radius.css',
  'elevation.css',
  'motion.css',
  'print.css',
] as const;

/** dist/tokens.css concatenation order — the DS's own order, base last. */
const CONCAT_ORDER = [
  'colors.css',
  'typography.css',
  'spacing.css',
  'radius.css',
  'elevation.css',
  'motion.css',
  'keyframes.css',
  'field-mode.css',
] as const;

const rewriteFontUrls = (css: string): string => css.replaceAll('../assets/fonts/', './fonts/');

function loadGenerated() {
  const rawByFile = new Map<string, string>();
  for (const f of ALL_FILES) rawByFile.set(f, readFileSync(join(tokensDir, f), 'utf8'));

  const declsByFile = new Map<string, TokenDecl[]>();
  const rootDecls: TokenDecl[] = [];
  const reducedMotion: TokenDecl[] = [];
  for (const file of DECL_FILES) {
    const parsed = parseCssFile(rawByFile.get(file) as string, file);
    declsByFile.set(file, parsed.root);
    rootDecls.push(...parsed.root);
    reducedMotion.push(...parsed.reducedMotion);
  }
  const fieldMode = parseCssFile(rawByFile.get('field-mode.css') as string, 'field-mode.css');
  const fontFaces = parseCssFile(rawByFile.get('fonts.css') as string, 'fonts.css').fontFaces;
  if (fontFaces.length === 0) throw new Error('fonts.css yielded no @font-face blocks');
  return { rawByFile, declsByFile, rootDecls, reducedMotion, fieldMode, fontFaces };
}

function buildBaseMap(rootDecls: TokenDecl[]): Map<string, string> {
  const baseMap = new Map<string, string>();
  for (const d of rootDecls) {
    if (baseMap.has(d.name)) throw new Error(`duplicate token --${d.name} (${d.sourceFile})`);
    baseMap.set(d.name, d.value);
  }
  return baseMap;
}

/** Resolve one field-mode scope against base + its own declarations (--field-edge is scoped). */
function resolveScope(base: Map<string, string>, decls: TokenDecl[]): Record<string, string> {
  const scopeMap = new Map(base);
  for (const d of decls) scopeMap.set(d.name, d.value);
  const out: Record<string, string> = {};
  for (const d of decls) out[d.name] = resolveValue(d.value, scopeMap);
  return out;
}

/** The WCAG gate — computed, never eyeballed; fail below floor (ported from v1). */
function assertContrastFloor(resolved: Map<string, string>) {
  const pairs = computePairs(resolved);
  const failing = pairs.filter((p) => !p.passes);
  if (failing.length > 0) {
    for (const p of failing) {
      console.error(
        `CONTRAST FAIL ${p.fg}(${p.fgValue}) on ${p.bg}(${p.bgValue}) = ${p.ratio}:1 < floor ${p.floor} [${p.role}]`,
      );
    }
    throw new Error(`${failing.length} contrast pair(s) below floor — build refused`);
  }
  return pairs;
}

function copyFonts() {
  mkdirSync(join(distDir, 'fonts'), { recursive: true });
  for (const f of FONTS) {
    const src = join(pkgDir, 'assets', 'fonts', f);
    const magic = readFileSync(src).subarray(0, 4).toString('latin1');
    if (magic !== 'wOF2') throw new Error(`${f} is not a woff2 file (magic: ${magic})`);
    copyFileSync(src, join(distDir, 'fonts', f));
  }
}

/** dist/base.css — the DS global stylesheet: styles.css with each @import inlined verbatim. */
function flattenStylesCss(rawByFile: Map<string, string>): string {
  const manifest = readFileSync(join(genDir, 'styles.css'), 'utf8');
  return manifest.replaceAll(/@import\s+"tokens\/([^"]+)";/g, (whole, file: string) => {
    const body = rawByFile.get(file);
    if (body === undefined) throw new Error(`styles.css imports unknown file: ${whole}`);
    return `/* ── tokens/${file} ── */\n${rewriteFontUrls(body)}`;
  });
}

function main() {
  const { rawByFile, declsByFile, rootDecls, reducedMotion, fieldMode, fontFaces } =
    loadGenerated();
  const baseMap = buildBaseMap(rootDecls);
  const resolved = new Map<string, string>();
  for (const [name, value] of baseMap) resolved.set(name, resolveValue(value, baseMap));

  const pairs = assertContrastFloor(resolved);
  copyFonts();

  const genHeader = (what: string): string =>
    `/* GENERATED by packages/theme/build.ts from src/_generated (ds:pull) — DO NOT EDIT. ${what} */\n`;

  // dist/tokens.css — faces first (URLs rewritten to travel with dist/fonts), DS order, base last
  const concat = CONCAT_ORDER.map((f) => rawByFile.get(f) as string).join('\n');
  writeFileSync(
    join(distDir, 'tokens.css'),
    `${genHeader('Web custom properties.')}${fontFaces.map(rewriteFontUrls).join('\n')}\n${concat}\n${rawByFile.get('base.css') as string}`,
  );

  // dist/base.css — the DS global stylesheet, flattened
  writeFileSync(
    join(distDir, 'base.css'),
    `${genHeader('The DS global stylesheet (styles.css, imports inlined).')}${flattenStylesCss(rawByFile)}`,
  );

  // dist/print.css — verbatim; the DS print surface must define the page box (design gap 32:
  // "one sheet, one page must hold on paper"). If a re-pull ever drops @page, add it back here.
  const printCss = rawByFile.get('print.css') as string;
  const withPage = /@page[\s{]/.test(printCss)
    ? printCss
    : `${printCss}\n/* Added by build.ts — design gap 32: one sheet, one page must hold on paper. */\n@page{size:A4 portrait;margin:12.7mm}\n`;
  writeFileSync(join(distDir, 'print.css'), withPage);

  // dist/tokens.json — flat --name → resolved value map of every custom property
  const flat: Record<string, string> = {
    $source: 'src/_generated/tokens/*.css (ds:pull)',
    $generator: 'packages/theme/build.ts',
  };
  for (const d of rootDecls) flat[`--${d.name}`] = resolved.get(d.name) as string;
  writeFileSync(join(distDir, 'tokens.json'), `${JSON.stringify(flat, null, 2)}\n`);

  // dist/contrast.pairs.json — the computed gate evidence
  writeFileSync(
    join(distDir, 'contrast.pairs.json'),
    `${JSON.stringify({ $note: 'Computed by build.ts; restricted roles annotated.', pairs }, null, 2)}\n`,
  );

  // dist/theme.ts + dist/index.ts — compiled to .js/.d.ts by tsc -p tsconfig.emit.json
  const theme = buildThemeObject({
    resolved,
    declsByFile,
    reducedMotion,
    fieldMode: {
      on: resolveScope(baseMap, fieldMode.fieldModeOn),
      off: resolveScope(baseMap, fieldMode.fieldModeOff),
    },
  });
  writeFileSync(join(distDir, 'theme.ts'), renderThemeTs(theme));
  writeFileSync(
    join(distDir, 'index.ts'),
    `${genHeader('Package entry.')}export { theme, type Theme } from './theme';\n`,
  );

  console.log(
    `theme build OK — ${rootDecls.length} tokens, ${fieldMode.fieldModeOn.length} field-mode overrides, ${pairs.length} contrast pairs green`,
  );
}

main();
