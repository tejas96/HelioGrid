/**
 * The web's custom properties, from the typed tokens. Light is the root; dark is a scope the
 * device's setting or `data-theme="dark"` turns on; field mode is a light variant that wins over
 * dark. Nothing here is a value: every value is read from `tokens/`.
 */
import { BRAND } from './tokens/brand';
import {
  COLOR_TOKENS,
  type ColorToken,
  DARK,
  FIELD,
  LIGHT,
  type ThemePalette,
} from './tokens/colors';
import {
  ELEVATION_DARK,
  ELEVATION_LIGHT,
  type ElevationLevel,
  LAYOUT,
  PRINT,
  RADIUS,
  type Shadow,
  SPACING,
} from './tokens/layout';
import {
  AMBIENT,
  DURATION,
  EASING,
  PRESS,
  REDUCED_DURATION,
  SKELETON_DELAY_MS,
  STAGGER,
} from './tokens/motion';
import { BUNDLED_FACES, FIELD_TYPE, FONT_STACKS, TYPE_ROLES, WEIGHTS } from './tokens/typography';

type Declarations = Readonly<Record<string, string | number>>;

const ALIASES: Readonly<Record<string, ColorToken>> = {
  'bg-page': 'canvas',
  'bg-well': 'canvas-sunken',
  'surface-card': 'surface',
  'bg-form': 'surface-form',
  'surface-row-alt': 'surface-alt',
  'text-body': 'text-secondary',
  'text-heading': 'text-primary',
  'text-meta': 'text-tertiary',
  'focus-ring': 'accent',
  link: 'accent',
  'link-hover': 'accent-hover',
};

const px = (n: number): string => (n === 0 ? '0' : `${n}px`);
const stack = (families: readonly string[]): string =>
  families.map((f) => (/^[a-z-]+$/.test(f) ? f : `"${f}"`)).join(',');
const shadow = (layers: readonly Shadow[]): string =>
  layers
    .map((l) => `${l.x}px ${l.y}px ${l.blur}px ${l.spread}px rgba(${l.rgb.join(',')},${l.opacity})`)
    .join(',');
const block = (selector: string, decls: Declarations): string =>
  `${selector}{\n${Object.entries(decls)
    .map(([k, v]) => `  --${k}:${v};`)
    .join('\n')}\n}\n`;

function palette(p: Partial<ThemePalette>): Declarations {
  return Object.fromEntries(
    COLOR_TOKENS.filter((t) => p[t] !== undefined).map((t) => [t, p[t] as string]),
  );
}

function elevation(levels: Readonly<Record<ElevationLevel, readonly Shadow[]>>): Declarations {
  return Object.fromEntries(
    Object.entries(levels).map(([level, layers]) => [level, shadow(layers)]),
  );
}

/** The soft logo-colour glow at the top of the page, and the lit glass of the one hero. */
function glows(scheme: 'light' | 'dark'): Declarations {
  const a = scheme === 'light' ? [0.1, 0.09, 0.07] : [0.14, 0.08, 0.1];
  const h = scheme === 'light' ? [0.22, 0.24, 0.16] : [0.34, 0.42, 0.34];
  return {
    'glow-page': [
      `radial-gradient(52rem 26rem at 88% -9rem,rgba(33,153,140,${a[0]}),transparent 70%)`,
      `radial-gradient(44rem 22rem at 58% -11rem,rgba(86,189,57,${a[1]}),transparent 70%)`,
      `radial-gradient(40rem 26rem at 8% -10rem,rgba(0,120,185,${a[2]}),transparent 70%)`,
    ].join(','),
    'glow-mark': `radial-gradient(circle,rgba(33,153,140,${scheme === 'light' ? 0.18 : 0.24}) 0%,rgba(86,189,57,${scheme === 'light' ? 0.1 : 0.14}) 40%,transparent 70%)`,
    'panel-glow': [
      `radial-gradient(70% 95% at 96% -12%,rgba(86,189,57,${h[0]}) 0%,transparent 58%)`,
      `radial-gradient(110% 130% at 100% 0%,rgba(33,153,140,${h[1]}) 0%,transparent 62%)`,
      `radial-gradient(90% 120% at 0% 110%,rgba(0,120,185,${h[2]}) 0%,transparent 60%)`,
      'linear-gradient(160deg,var(--panel) 0%,var(--panel-deep) 100%)',
    ].join(','),
  };
}

function rootDeclarations(): Declarations {
  const type: Record<string, string | number> = {
    'font-display': stack(FONT_STACKS.display),
    'font-sans': stack(FONT_STACKS.sans),
    'font-mono': stack(FONT_STACKS.mono),
  };
  for (const [name, w] of Object.entries(WEIGHTS)) type[`fw-${name}`] = w;
  for (const [role, r] of Object.entries(TYPE_ROLES)) {
    type[`fs-${role}`] = px(r.size);
    type[`lh-${role}`] = px(r.lineHeight);
    type[`tr-${role}`] = `${r.tracking}em`;
  }
  for (const [part, size] of Object.entries(FIELD_TYPE)) type[`fs-field-${part}`] = px(size);

  const sizes: Record<string, string> = {};
  for (const group of [SPACING, LAYOUT, RADIUS, PRINT]) {
    for (const [k, v] of Object.entries(group)) sizes[k] = px(v);
  }

  const motion: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(DURATION)) motion[`dur-${k}`] = `${v}ms`;
  for (const [k, v] of Object.entries(AMBIENT)) motion[`amb-${k}`] = `${v}ms`;
  for (const [k, v] of Object.entries(EASING)) motion[`ease-${k}`] = `cubic-bezier(${v.join(',')})`;
  motion['press-scale'] = PRESS.scale;
  motion['stagger-step'] = `${STAGGER.stepMs}ms`;
  motion.rise = px(STAGGER.risePx);
  motion['skeleton-delay'] = `${SKELETON_DELAY_MS}ms`;

  const aliases = Object.fromEntries(Object.entries(ALIASES).map(([a, t]) => [a, `var(--${t})`]));
  return {
    ...palette(LIGHT),
    ...aliases,
    'gradient-brand': `linear-gradient(90deg,${BRAND.green},${BRAND.teal},${BRAND.blue})`,
    /* The logo mark's disc: the same three colours on the diagonal the logo draws. */
    'gradient-mark': `linear-gradient(160deg,${BRAND.green},${BRAND.teal} 50%,${BRAND.blue})`,
    ...glows('light'),
    ...type,
    ...sizes,
    'doc-lh': 1.5,
    'doc-rule': 'rgba(20,23,26,0.10)',
    e0: 'none',
    ...elevation(ELEVATION_LIGHT),
    'control-edge': 'none',
    'surface-edge': 'none',
    'track-edge': 'none',
    ...motion,
  };
}

const DARK_DECLS: Declarations = {
  ...palette(DARK),
  ...glows('dark'),
  ...elevation(ELEVATION_DARK),
};

const FIELD_EDGE = '#5B6069';
/** Field mode lays its overrides over the WHOLE light palette, so it wins over dark too. */
const FIELD_DECLS: Declarations = {
  ...palette({ ...LIGHT, ...FIELD }),
  'field-edge': FIELD_EDGE,
  ...glows('light'),
  'glow-page': 'none',
  'glow-mark': 'none',
  e1: `0 0 0 1px ${FIELD_EDGE},0 1px 2px rgba(20,23,26,0.10)`,
  e2: `0 0 0 1px ${FIELD_EDGE},0 2px 6px rgba(20,23,26,0.10)`,
  e3: `0 0 0 1px ${FIELD_EDGE},0 6px 16px rgba(20,23,26,0.12)`,
  e4: `0 0 0 1px ${FIELD_EDGE},0 10px 28px rgba(20,23,26,0.14)`,
  e5: `0 0 0 1.5px ${FIELD_EDGE},0 18px 44px rgba(20,23,26,0.18)`,
  'control-edge': `inset 0 0 0 1.5px ${FIELD_EDGE}`,
  'surface-edge': `0 0 0 1px ${FIELD_EDGE}`,
  'track-edge': `0 0 0 1px ${FIELD_EDGE}`,
};

/**
 * Paper is always light: a proposal prints on white and its preview shows the same sheet, so a
 * `[data-paper]` subtree — a document, a drawing sheet — takes the light palette in every scheme,
 * and printing takes it for the whole page (a dark scheme's light ink would vanish on white paper).
 */
const PAPER_DECLS: Declarations = {
  ...palette(LIGHT),
  ...glows('light'),
  ...elevation(ELEVATION_LIGHT),
};

function fontFaces(): string {
  return BUNDLED_FACES.flatMap((face) =>
    face.web.map((w) => {
      const format = w.file.endsWith('.woff2') ? 'woff2' : 'woff';
      const range = 'unicodeRange' in w ? `unicode-range:${w.unicodeRange};` : '';
      return `@font-face{font-family:"${face.family}";src:url("./fonts/${w.file}") format("${format}");font-weight:100 900;font-style:normal;font-display:swap;${range}}`;
    }),
  ).join('\n');
}

const reducedMotion = Object.fromEntries(
  Object.entries(REDUCED_DURATION).map(([k, v]) => [`dur-${k}`, `${v}ms`]),
);

/** `dist/tokens.css`: the faces, every token in light, dark and field, and reduced motion. */
export function renderTokensCss(keyframes: string, fieldRules: string): string {
  const dark = (selector: string) =>
    block(selector, DARK_DECLS).replace('{\n', '{\n  color-scheme:dark;\n');
  return [
    fontFaces(),
    block(':root', rootDeclarations()).replace('{\n', '{\n  color-scheme:light;\n'),
    `@media (prefers-color-scheme:dark){\n${dark(':root:not([data-theme="light"])')}}\n`,
    dark(':root[data-theme="dark"]'),
    block(':root[data-field-mode="on"],[data-field-mode="on"]', FIELD_DECLS).replace(
      '{\n',
      '{\n  color-scheme:light;\n',
    ),
    block('[data-paper]', PAPER_DECLS).replace('{\n', '{\n  color-scheme:light;\n'),
    `@media print{\n${block(':root,:root[data-theme="dark"],:root:not([data-theme="light"])', PAPER_DECLS).replace('{\n', '{\n  color-scheme:light;\n')}}\n`,
    `@media (prefers-reduced-motion:reduce){\n${block(':root', reducedMotion)}}\n`,
    keyframes,
    fieldRules,
  ].join('\n');
}

/** The flat `--name` → light value map the `ui-colour-pairs` invariant reads. */
export function lightTokenMap(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(rootDeclarations()).map(([k, v]) => [`--${k}`, String(v)]),
  );
}
