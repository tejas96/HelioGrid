import contrastPairs from '@heliogrid/tokens/contrast.pairs.json';
import tokensJson from '@heliogrid/tokens/tokens.json';

/**
 * Every derived token grouping the /design reference renders, computed once from
 * dist/tokens.json (docs/10 §6). A token that does not appear in one of these groups does
 * not render — "add a token → it renders at /design or nobody can verify it."
 */

export interface TokenRow {
  name: string;
  value: string;
  resolvedValue?: string;
  sourceFile: string;
  kindHint: string | null;
  extension: boolean | string;
}

export interface ContrastPair {
  fg: string;
  bg: string;
  role: string;
  floor: number;
  ratio: number;
  passes: boolean;
  restriction?: string;
}

export const tokens = tokensJson.tokens as TokenRow[];
export const source = tokensJson.$source;
export const generator = tokensJson.$generator;
export const reducedMotionOverrides = tokensJson.reducedMotionOverrides;

const byFile = (f: string) => tokens.filter((t) => t.sourceFile === f);
const byPrefix = (p: string) => tokens.filter((t) => t.name.startsWith(p));

const isColor = (t: TokenRow) =>
  /^#|^rgba|^linear-gradient|^radial-gradient/.test(t.resolvedValue ?? t.value);

export const colorTokens = tokens.filter(
  (t) => (t.sourceFile === 'colors.css' && isColor(t)) || t.name.startsWith('brand-'),
);
export const aliasTokens = byFile('colors.css').filter((t) => !isColor(t));
export const dataViz = [
  ...byPrefix('data-roof-'),
  ...byPrefix('data-string-'),
  ...byPrefix('data-scale-'),
];
export const spacing = byFile('spacing.css');
export const radius = byFile('radius.css');
export const elevation = byFile('elevation.css');
export const motion = byFile('motion.css');
export const fontsTypo = [...byFile('fonts.css'), ...byFile('typography.css')];
export const pairs = contrastPairs.pairs as ContrastPair[];
