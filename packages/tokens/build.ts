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
 * And ONE emit outside dist/, because native build systems cannot import this package —
 * both are COMMITTED, not gitignored, and CI re-runs this script to prove they are fresh:
 *   apps/mobile/…/res/values/colors.xml            Android splash canvas
 *   apps/mobile/…/SplashCanvas.colorset/…json      iOS splash canvas
 * See emitNativeSplashColour() for why, and docs/13 UXG-26 for the decision.
 *
 * NEVER hand-transcribe values. NEVER read _ds_manifest.json (it snapshotted the 1ms
 * reduced-motion overrides as canonical — the exact drift this generator prevents).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePairs, findUndeclaredPairs } from './src/contrast';
import { emitNativeSplashColour } from './src/emit-splash';
import { buildThemeObject, renderThemeTs } from './src/emit-theme';
import {
  A11Y_COLOR_OVERRIDES,
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

/** Reads and parses every ds-source token/font-face CSS file, after checking they all exist. */
function loadDsSourceFiles() {
  const available = readdirSync(dsTokensDir);
  for (const f of [...TOKEN_FILES, 'fonts.css', 'base.css']) {
    if (!available.includes(f)) throw new Error(`ds-source missing ${f} — refusing to emit`);
  }

  const rawByFile = new Map<string, string>();
  const rootDecls: TokenDecl[] = [];
  const reducedMotion: TokenDecl[] = [];
  const dataMode: TokenDecl[] = [];
  const fontFaces: string[] = [];

  for (const file of [...TOKEN_FILES, 'fonts.css']) {
    const css = readFileSync(join(dsTokensDir, file), 'utf8');
    rawByFile.set(file, css);
    const parsed = parseCssFile(css, file);
    rootDecls.push(...parsed.root);
    reducedMotion.push(...parsed.reducedMotion);
    dataMode.push(...parsed.dataMode);
    fontFaces.push(...parsed.fontFaces);
  }
  return { rawByFile, rootDecls, reducedMotion, dataMode, fontFaces };
}

/** Base value map (top-level :root only — reduced-motion/data-mode overrides NEVER land here). */
function buildBaseMap(rootDecls: TokenDecl[]): Map<string, string> {
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
  // Ext 6: two ds-source colours darkened to clear WCAG AA for text (owner 2026-07-30).
  // Overrides, not additions — ALL_EXTENSION_TOKENS deliberately refuses to collide.
  for (const [name, value] of Object.entries(A11Y_COLOR_OVERRIDES)) {
    if (!baseMap.has(name))
      throw new Error(`a11y override --${name} has no ds-source token to override`);
    baseMap.set(name, value);
  }
  return baseMap;
}

/** Ext 5: contrast gate — computed, never eyeballed; fail below floor. */
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

/** Ext 5b: coverage — a pairing a component USES but nobody declared is unchecked, not safe. */
function assertContrastCoverage() {
  const uiCssDir = join(repoRoot, 'packages', 'ui', 'src');
  const cssFiles = existsSync(uiCssDir)
    ? readdirSync(uiCssDir, { recursive: true })
        .map(String)
        .filter((f) => f.endsWith('.css'))
        .map((f) => ({
          path: `packages/ui/src/${f}`,
          text: readFileSync(join(uiCssDir, f), 'utf8'),
        }))
    : [];
  const undeclared = findUndeclaredPairs(cssFiles);
  if (undeclared.length > 0) {
    throw new Error(
      `tokens: ${undeclared.length} foreground/background pairing(s) used by components but ` +
        `not in DECLARED_PAIRS — they are UNCHECKED, not safe:\n  - ${undeclared.join('\n  - ')}\n\n` +
        'Add each to DECLARED_PAIRS with the WCAG floor its ROLE requires (never the measured ' +
        'value — that would weaken the gate to pass), or change the component to use a declared ' +
        'pairing. If it is not a real pairing (a hidden icon stroke over an inactive-state ' +
        'background), add it to NOT_A_PAIRING with the reason.',
    );
  }
  console.log(
    `contrast coverage OK — ${cssFiles.length} component CSS files scanned, every per-rule fg/bg pairing declared`,
  );
}

/**
 * The ONE emit that leaves `dist/` — the native splash colour, written straight into both
 * native projects and COMMITTED (docs/13 UXG-26).
 *
 * Why it has to work this way: an iOS storyboard and an Android theme are consumed by
 * xcodebuild and Gradle, which cannot import this package at any point. The only
 * alternatives were hand-transcribing `--canvas` into two native files — the drift
 * `ui-adherence.md` forbids and `_ds_manifest.json` already proved real — or a Gradle copy
 * task plus an Xcode build phase, which is more native surgery for one colour.
 *
 * It is a deliberate exception to "uses: nothing in the workspace": this package still
 * IMPORTS nothing, but it does now WRITE into apps/mobile. Nothing mechanical enforces that
 * direction, so it is stated here and in CLAUDE.md rather than left to be discovered.
 *
 * NOT declared in turbo `outputs`: turbo tracks outputs inside the package only. A cached
 * `turbo build` therefore does not rewrite these files — which is why the CI freshness check
 * calls the package script directly (`pnpm --filter @heliogrid/tokens build`) and never
 * through turbo. Cache replaying a stale gate is the landmine this package already carries.
 */
function main() {
  const {
    rawByFile,
    rootDecls,
    reducedMotion,
    dataMode,
    fontFaces: parsedFontFaces,
  } = loadDsSourceFiles();
  const baseMap = buildBaseMap(rootDecls);

  const resolved = new Map<string, string>();
  for (const [name, value] of baseMap) resolved.set(name, resolveValue(value, baseMap));

  const pairs = assertContrastFloor(resolved);
  assertContrastCoverage();

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
  const fontFaces = parsedFontFaces.map((f) => f.replaceAll('../assets/fonts/', './fonts/'));
  const rawConcat = TOKEN_FILES.map((f) => rawByFile.get(f) as string).join('\n');
  const extensionCss = [
    `/* ${EXTENSION_MARKER} — everything below is generated extension, NOT ds-source (docs/10 §2). */`,
    `/* ext 1: Devanagari face + extended sans chain (Geist has zero Devanagari coverage) */`,
    NOTO_FONT_FACE,
    `:root{`,
    `  --font-sans:${FONT_SANS_EXTENDED};`,
    `/* ext 6: WCAG AA overrides of two ds-source colours (docs/13 UXG-A11Y-02/03) */`,
    ...Object.entries(A11Y_COLOR_OVERRIDES).map(([n, v]) => `  --${n}:${v};`),
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
        value:
          d.name === 'font-sans' ? FONT_SANS_EXTENDED : (A11Y_COLOR_OVERRIDES[d.name] ?? d.value),
        resolvedValue: resolved.get(d.name),
        sourceFile: d.sourceFile,
        kindHint: d.kindHint ?? null,
        extension:
          d.name === 'font-sans'
            ? 'font-sans chain extended (ext 1)'
            : d.name in A11Y_COLOR_OVERRIDES
              ? 'WCAG AA override (ext 6)'
              : false,
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

  emitNativeSplashColour(resolved, repoRoot);

  console.log(
    `tokens build OK — ${rootDecls.length} ds-source tokens, ${Object.keys(ALL_EXTENSION_TOKENS).length + 1} extension tokens, ${pairs.length} contrast pairs green`,
  );
}

main();
