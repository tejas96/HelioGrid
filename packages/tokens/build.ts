/**
 * packages/tokens generator — docs/10 §2, the canonical mechanism.
 *
 * Parses design/ds-source/tokens/*.css as the source of truth and emits:
 *   dist/tokens.css           web custom properties, near-verbatim + marked extensions
 *   dist/base.css             the ds-source reset, verbatim
 *   dist/theme.ts             RN theme object (compiled to .js/.d.ts by tsc -p tsconfig.emit.json)
 *   dist/tokens.json          flat resolved contract for /design, PDF templates, tooling
 *   dist/contrast.pairs.json  computed WCAG ratios + ruling-C annotations — build FAILS below floor
 *   dist/fonts/*              vendored woff2 (Geist, Geist Mono, Noto Sans Devanagari)
 *
 * NEVER hand-transcribe values. NEVER read _ds_manifest.json (it snapshotted the 1ms
 * reduced-motion overrides as canonical — the exact drift this generator prevents).
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePairs } from './src/contrast';
import { buildThemeObject, renderThemeTs } from './src/emit-theme';
import {
  ALL_EXTENSION_TOKENS,
  EXTENSION_MARKER,
  FONT_SANS_EXTENDED,
  NOTO_FONT_FACE,
} from './src/extensions';
import { parseCssFile, resolveValue, type TokenDecl } from './src/parse';

const pkgDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(pkgDir, '..', '..');
const dsTokensDir = join(repoRoot, 'design', 'ds-source', 'tokens');
const dsFontsDir = join(repoRoot, 'design', 'ds-source', 'assets', 'fonts');
const distDir = join(pkgDir, 'dist');

/** Fixed emission order — tokens before base; fonts.css handled via @font-face extraction. */
const TOKEN_FILES = [
  'colors.css',
  'typography.css',
  'spacing.css',
  'radius.css',
  'elevation.css',
  'motion.css',
] as const;

function main() {
  const available = readdirSync(dsTokensDir);
  for (const f of [...TOKEN_FILES, 'fonts.css', 'base.css']) {
    if (!available.includes(f)) throw new Error(`ds-source missing ${f} — refusing to emit`);
  }

  const rawByFile = new Map<string, string>();
  const rootDecls: TokenDecl[] = [];
  const reducedMotion: TokenDecl[] = [];
  const dataMode: TokenDecl[] = [];
  let fontFaces: string[] = [];

  for (const file of [...TOKEN_FILES, 'fonts.css']) {
    const css = readFileSync(join(dsTokensDir, file), 'utf8');
    rawByFile.set(file, css);
    const parsed = parseCssFile(css, file);
    rootDecls.push(...parsed.root);
    reducedMotion.push(...parsed.reducedMotion);
    dataMode.push(...parsed.dataMode);
    fontFaces.push(...parsed.fontFaces);
  }

  // Base value map (top-level :root only — reduced-motion/data-mode overrides NEVER land here)
  const baseMap = new Map<string, string>();
  for (const d of rootDecls) {
    if (baseMap.has(d.name)) throw new Error(`duplicate token --${d.name} (${d.sourceFile})`);
    baseMap.set(d.name, d.value);
  }
  for (const [name, value] of Object.entries(ALL_EXTENSION_TOKENS)) {
    if (baseMap.has(name)) throw new Error(`extension --${name} collides with a ds-source token`);
    baseMap.set(name, value);
  }
  // Ext 1: the sans chain gains Noto Sans Devanagari (override, marked in the CSS block below)
  baseMap.set('font-sans', FONT_SANS_EXTENDED);

  const resolved = new Map<string, string>();
  for (const [name, value] of baseMap) resolved.set(name, resolveValue(value, baseMap));

  // Ext 5: contrast gate — computed, never eyeballed; fail below floor
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

  mkdirSync(join(distDir, 'fonts'), { recursive: true });

  // dist/fonts — vendored binaries travel with the css
  copyFileSync(join(dsFontsDir, 'Geist[wght].woff2'), join(distDir, 'fonts', 'Geist[wght].woff2'));
  copyFileSync(
    join(dsFontsDir, 'GeistMono[wght].woff2'),
    join(distDir, 'fonts', 'GeistMono[wght].woff2'),
  );
  copyFileSync(
    join(pkgDir, 'assets', 'fonts', 'NotoSansDevanagari[wght].woff2'),
    join(distDir, 'fonts', 'NotoSansDevanagari[wght].woff2'),
  );

  // dist/tokens.css — near-verbatim concat (URL-rewritten faces first), extensions appended
  fontFaces = fontFaces.map((f) => f.replaceAll('../assets/fonts/', './fonts/'));
  const rawConcat = TOKEN_FILES.map((f) => rawByFile.get(f) as string).join('\n');
  const extensionCss = [
    `/* ${EXTENSION_MARKER} — everything below is generated extension, NOT ds-source (docs/10 §2). */`,
    `/* ext 1: Devanagari face + extended sans chain (Geist has zero Devanagari coverage) */`,
    NOTO_FONT_FACE,
    `:root{`,
    `  --font-sans:${FONT_SANS_EXTENDED};`,
    ...Object.entries(ALL_EXTENSION_TOKENS).map(([n, v]) => `  --${n}:${v};`),
    `}`,
  ].join('\n');
  writeFileSync(
    join(distDir, 'tokens.css'),
    `/* GENERATED by packages/tokens/build.ts from design/ds-source/tokens/*.css — DO NOT EDIT. */\n${fontFaces.join('\n')}\n${rawConcat}\n${extensionCss}\n`,
  );

  // dist/base.css — the reset, verbatim
  writeFileSync(
    join(distDir, 'base.css'),
    `/* GENERATED copy of design/ds-source/tokens/base.css — DO NOT EDIT. */\n${readFileSync(join(dsTokensDir, 'base.css'), 'utf8')}`,
  );

  // dist/tokens.json — the flat resolved contract
  const tokensJson = {
    $source: 'design/ds-source/tokens/*.css',
    $generator: 'packages/tokens/build.ts',
    tokens: [
      ...rootDecls.map((d) => ({
        name: d.name,
        value: d.name === 'font-sans' ? FONT_SANS_EXTENDED : d.value,
        resolvedValue: resolved.get(d.name),
        sourceFile: d.sourceFile,
        kindHint: d.kindHint ?? null,
        extension: d.name === 'font-sans' ? 'font-sans chain extended (ext 1)' : false,
      })),
      ...Object.entries(ALL_EXTENSION_TOKENS).map(([name, value]) => ({
        name,
        value,
        resolvedValue: resolved.get(name),
        sourceFile: 'packages/tokens/src/extensions.ts',
        kindHint: null,
        extension: true,
      })),
    ],
    reducedMotionOverrides: reducedMotion.map((d) => ({ name: d.name, value: d.value })),
    dataModePlaceholder: dataMode.map((d) => ({ name: d.name, value: d.value })),
  };
  writeFileSync(join(distDir, 'tokens.json'), `${JSON.stringify(tokensJson, null, 2)}\n`);

  // dist/contrast.pairs.json — ext 5
  writeFileSync(
    join(distDir, 'contrast.pairs.json'),
    `${JSON.stringify({ $note: 'Computed by build.ts; ruling-C restricted roles annotated.', pairs }, null, 2)}\n`,
  );

  // dist/theme.ts — RN theme (colors.css names + extensions)
  const colorNames = [
    ...rootDecls.filter((d) => d.sourceFile === 'colors.css').map((d) => d.name),
    ...Object.keys(ALL_EXTENSION_TOKENS).filter((n) => n.startsWith('brand-')),
  ];
  const theme = buildThemeObject(resolved, colorNames);
  writeFileSync(join(distDir, 'theme.ts'), renderThemeTs(theme));

  console.log(
    `tokens build OK — ${rootDecls.length} ds-source tokens, ${Object.keys(ALL_EXTENSION_TOKENS).length + 1} extension tokens, ${pairs.length} contrast pairs green`,
  );
}

main();
