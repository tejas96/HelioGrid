/**
 * Emit dist/theme.ts — the RN theme object with the SAME token names as web (px → dp).
 * Purely derived from the parsed src/_generated values; nothing here is hand-transcribed.
 * Follows the v1 emitter: px strings become numbers where RN wants numbers, box-shadows
 * become RN-shaped approximations, unitless line-heights multiply out against font size.
 */
import { type ParsedShadow, parseShadow, pxToNumber, type TokenDecl } from './parse';

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

function ms(resolved: Map<string, string>, name: string): number {
  const v = resolved.get(name);
  if (!v) throw new Error(`missing --${name}`);
  return Number(v.replace('ms', ''));
}

/** First quoted family in a font stack — "Geist","Inter",… → Geist. */
function primaryFamily(stack: string): string {
  const m = stack.match(/^"([^"]+)"/);
  if (!m) throw new Error(`font stack has no quoted primary family: ${stack}`);
  return m[1] as string;
}

interface ThemeInputs {
  resolved: Map<string, string>;
  declsByFile: Map<string, TokenDecl[]>;
  reducedMotion: TokenDecl[];
  fieldMode: { on: Record<string, string>; off: Record<string, string> };
}

function namesFrom(declsByFile: Map<string, TokenDecl[]>, file: string): string[] {
  const decls = declsByFile.get(file);
  if (!decls || decls.length === 0) throw new Error(`no :root declarations parsed from ${file}`);
  return decls.map((d) => d.name);
}

export function buildThemeObject(input: ThemeInputs) {
  const { resolved, declsByFile, reducedMotion, fieldMode } = input;

  const colors: Record<string, string> = {};
  for (const n of namesFrom(declsByFile, 'colors.css')) colors[n] = resolved.get(n) as string;

  const spacingSource = namesFrom(declsByFile, 'spacing.css');
  const spacingNames = spacingSource.filter((n) => n.startsWith('sp-'));
  const layoutNames = spacingSource.filter((n) => !n.startsWith('sp-'));

  const radiusNames = namesFrom(declsByFile, 'radius.css').filter((n) => n !== 'r-feature-tile');
  const featureTile = (resolved.get('r-feature-tile') as string)
    .split(/\s+/)
    .map((p) => pxToNumber(p) ?? 0);

  const elevation: Record<string, RnShadow | null> = {};
  for (let i = 0; i <= 5; i++) {
    elevation[`e${i}`] = rnShadow(parseShadow(resolved.get(`e${i}`) as string), i);
  }

  const typography: Record<string, ReturnType<typeof typeRole>> = {};
  for (const role of TYPE_ROLES) typography[role] = typeRole(resolved, role);

  const weights: Record<string, number> = {};
  for (const n of namesFrom(declsByFile, 'typography.css')) {
    if (n.startsWith('fw-')) weights[n.slice(3)] = Number(resolved.get(n));
  }

  const reducedDurations: Record<string, number> = {};
  for (const d of reducedMotion) {
    if (d.name.startsWith('dur-'))
      reducedDurations[d.name.slice(4)] = Number(d.value.replace('ms', ''));
  }

  return {
    colors,
    type: {
      families: {
        sans: primaryFamily(resolved.get('font-sans') as string),
        mono: primaryFamily(resolved.get('font-mono') as string),
      },
      stacks: {
        sans: resolved.get('font-sans') as string,
        mono: resolved.get('font-mono') as string,
      },
      weights,
      roles: typography,
    },
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
    motion: {
      durations: {
        micro: ms(resolved, 'dur-micro'),
        standard: ms(resolved, 'dur-standard'),
        emphasised: ms(resolved, 'dur-emphasised'),
        ambient: ms(resolved, 'dur-ambient'),
      },
      easings: {
        standard: cubicBezier(resolved.get('ease-standard') as string),
        enter: cubicBezier(resolved.get('ease-enter') as string),
        exit: cubicBezier(resolved.get('ease-exit') as string),
        spring: cubicBezier(resolved.get('ease-spring') as string),
      },
      /** prefers-reduced-motion values, for RN's AccessibilityInfo.isReduceMotionEnabled. */
      reducedMotionDurations: reducedDurations,
    },
    /**
     * F7-16 field mode as data: the exact override sets from field-mode.css, var()s resolved
     * within their own scope. RN implements the mode by swapping these over the base theme;
     * multi-part box-shadows stay strings — RN approximates them per component.
     */
    fieldMode,
  };
}

export function renderThemeTs(theme: unknown): string {
  return [
    '/**',
    ' * GENERATED by packages/theme/build.ts from src/_generated/tokens/*.css — DO NOT EDIT.',
    ' * Same token names as web, px → dp.',
    ' */',
    `export const theme = ${JSON.stringify(theme, null, 2)} as const;`,
    '',
    'export type Theme = typeof theme;',
    '',
  ].join('\n');
}
