import { ALL_EXTENSION_TOKENS, DATA_ROOF, DATA_SCALE, DATA_STRING } from './extensions';
import { type ParsedShadow, parseShadow, pxToNumber } from './parse';

/**
 * Emit dist/theme.ts — the RN theme object with the SAME token names as web (px → dp).
 * Purely derived from the parsed ds-source values + marked extensions.
 */

interface RnShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowRadius: number;
  shadowOpacity: number;
  elevation: number;
}

function rnShadow(s: ParsedShadow | null, level: number): RnShadow | null {
  if (!s) return null;
  return {
    shadowColor: s.color,
    shadowOffset: { width: s.offsetX, height: s.offsetY },
    shadowRadius: s.blurRadius,
    shadowOpacity: s.opacity,
    elevation: level,
  };
}

const TYPE_ROLES = [
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'overline',
  'button',
  'table',
] as const;

function typeRole(resolved: Map<string, string>, role: string) {
  const fs = resolved.get(`fs-${role}`);
  if (!fs) throw new Error(`missing --fs-${role}`);
  const fontSize = pxToNumber(fs);
  if (fontSize === undefined) throw new Error(`--fs-${role} is not px: ${fs}`);
  const lhRaw = resolved.get(`lh-${role}`);
  let lineHeight: number | undefined;
  if (lhRaw !== undefined) {
    const px = pxToNumber(lhRaw);
    lineHeight = px !== undefined ? px : Math.round(Number(lhRaw) * fontSize * 10) / 10;
  }
  const trRaw = resolved.get(`tr-${role}`);
  let letterSpacing: number | undefined;
  if (trRaw !== undefined) {
    const em = Number(trRaw.replace('em', ''));
    letterSpacing = Math.round(em * fontSize * 100) / 100;
  }
  return { fontSize, lineHeight, letterSpacing };
}

function cubicBezier(v: string): [number, number, number, number] {
  const m = v.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) throw new Error(`not a cubic-bezier: ${v}`);
  const parts = (m[1] as string).split(',').map((n) => Number(n.trim()));
  return [parts[0] as number, parts[1] as number, parts[2] as number, parts[3] as number];
}

function pick(resolved: Map<string, string>, prefix: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of resolved) if (k.startsWith(prefix)) out[k] = v;
  return out;
}

function pickPx(resolved: Map<string, string>, names: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of names) {
    const v = resolved.get(n);
    if (v === undefined) throw new Error(`missing --${n}`);
    const px = pxToNumber(v);
    if (px === undefined) throw new Error(`--${n} is not px: ${v}`);
    out[n] = px;
  }
  return out;
}

export function buildThemeObject(resolved: Map<string, string>, colorNames: string[]) {
  const colors: Record<string, string> = {};
  for (const n of colorNames) colors[n] = resolved.get(n) as string;

  const spacingNames = [...resolved.keys()].filter((k) => k.startsWith('sp-'));
  const layoutNames = [
    'screen-pad-mobile',
    'screen-pad-desktop',
    'screen-pad-mobile-fn',
    'screen-pad-desktop-fn',
    'sidebar-w',
    'sidebar-w-collapsed',
    'header-h',
    'topbar-h-mobile',
    'bottomnav-h',
    'content-max',
    'gutter-mobile',
    'gutter-tablet',
    'gutter-desktop',
  ];
  const radiusNames = [...resolved.keys()].filter(
    (k) => (k.startsWith('r-') || k.startsWith('rf-')) && k !== 'r-feature-tile',
  );

  const elevation: Record<string, RnShadow | null> = {};
  for (let i = 0; i <= 5; i++) {
    elevation[`e${i}`] = rnShadow(parseShadow(resolved.get(`e${i}`) as string), i);
  }

  const typography: Record<string, ReturnType<typeof typeRole>> = {};
  for (const role of TYPE_ROLES) typography[role] = typeRole(resolved, role);

  const featureTile = (resolved.get('r-feature-tile') as string)
    .split(/\s+/)
    .map((p) => pxToNumber(p) ?? 0);

  return {
    colors,
    /** @heliogrid-extension studio data-viz namespaces (docs/10 §2 ext 4) */
    dataViz: { roof: DATA_ROOF, string: DATA_STRING, scale: DATA_SCALE },
    spacing: pickPx(resolved, spacingNames),
    layout: pickPx(resolved, layoutNames),
    radius: {
      ...pickPx(resolved, radiusNames),
      'r-feature-tile': {
        topLeft: featureTile[0] as number,
        topRight: featureTile[1] as number,
        bottomRight: featureTile[2] as number,
        bottomLeft: featureTile[3] as number,
      },
    },
    elevation,
    typography,
    fonts: {
      sans: 'Geist',
      mono: 'Geist Mono',
      /** @heliogrid-extension Devanagari face — RN needs explicit run-splitting via <AppText> */
      devanagari: 'Noto Sans Devanagari',
      /** RN needs static instances (synthetic bolding is banned, docs/10 §6) */
      staticFamilyByWeight: {
        sans: {
          '400': 'Geist-Regular',
          '500': 'Geist-Medium',
          '600': 'Geist-SemiBold',
          '700': 'Geist-Bold',
        },
        mono: {
          '400': 'GeistMono-Regular',
          '500': 'GeistMono-Medium',
          '600': 'GeistMono-SemiBold',
          '700': 'GeistMono-Bold',
        },
        devanagari: {
          '400': 'NotoSansDevanagari-Regular',
          '500': 'NotoSansDevanagari-Medium',
          '600': 'NotoSansDevanagari-SemiBold',
          '700': 'NotoSansDevanagari-Bold',
        },
      },
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      /** @heliogrid-extension ruling D — 600 sanctioned */
      semibold: 600,
      bold: 700,
    },
    motion: {
      durations: {
        micro: pxlessMs(resolved, 'dur-micro'),
        standard: pxlessMs(resolved, 'dur-standard'),
        emphasised: pxlessMs(resolved, 'dur-emphasised'),
        ambient: pxlessMs(resolved, 'dur-ambient'),
      },
      easings: {
        standard: cubicBezier(resolved.get('ease-standard') as string),
        enter: cubicBezier(resolved.get('ease-enter') as string),
        exit: cubicBezier(resolved.get('ease-exit') as string),
        spring: cubicBezier(resolved.get('ease-spring') as string),
      },
      pressScale: { button: 0.97, iconButton: 0.94 },
    },
    extensions: Object.keys(ALL_EXTENSION_TOKENS),
  };
}

function pxlessMs(resolved: Map<string, string>, name: string): number {
  const v = resolved.get(name);
  if (!v) throw new Error(`missing --${name}`);
  return Number(v.replace('ms', ''));
}

export function renderThemeTs(theme: unknown): string {
  return [
    '/**',
    ' * GENERATED by packages/tokens/build.ts from design/ds-source/tokens/*.css — DO NOT EDIT.',
    ' * Same token names as web, px → dp. Extensions are marked @heliogrid-extension.',
    ' */',
    `export const theme = ${JSON.stringify(theme, null, 2)} as const;`,
    '',
    'export type Theme = typeof theme;',
    '',
  ].join('\n');
}

export { pick };
