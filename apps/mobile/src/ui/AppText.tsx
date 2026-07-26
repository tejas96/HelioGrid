import { theme } from '@heliogrid/tokens/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

/**
 * THE text primitive — screens may not use RN <Text> directly (docs/10 §7.5).
 * RN has no per-codepoint fallback to bundled fonts: Devanagari runs (U+0900–U+097F)
 * get the Noto family explicitly. Weights map to static font files (no synthetic bold).
 */
export type TypeRole = keyof typeof theme.typography;
type Weight = keyof typeof theme.fonts.staticFamilyByWeight.sans;

const DEVANAGARI = /[ऀ-ॿ᳐-᳹꣠-ꣿ]/;

export interface AppTextProps extends Omit<TextProps, 'style' | 'role'> {
  children: ReactNode;
  role?: TypeRole;
  weight?: Weight;
  mono?: boolean;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: TextStyle;
}

function familyFor(text: string, mono: boolean, weight: Weight): string {
  const fam = theme.fonts.staticFamilyByWeight;
  if (mono) return fam.mono[weight];
  return DEVANAGARI.test(text) ? fam.devanagari[weight] : fam.sans[weight];
}

export function AppText({
  children,
  role = 'body',
  weight = '400',
  mono = false,
  color = theme.colors['text-primary'],
  align,
  style,
  ...rest
}: AppTextProps) {
  const t = theme.typography[role];
  const runs = typeof children === 'string' ? splitRuns(children) : null;
  const base: TextStyle = {
    fontSize: t.fontSize,
    lineHeight: 'lineHeight' in t ? t.lineHeight : undefined,
    letterSpacing: 'letterSpacing' in t ? t.letterSpacing : undefined,
    color,
    textAlign: align,
    fontVariant: mono ? ['tabular-nums'] : undefined,
  };
  if (!runs) {
    return (
      <Text
        style={[
          base,
          styles.base,
          { fontFamily: theme.fonts.staticFamilyByWeight.sans[weight] },
          style,
        ]}
        {...rest}
      >
        {children}
      </Text>
    );
  }
  return (
    <Text style={[base, styles.base, style]} {...rest}>
      {runs.map((run, i) => (
        <Text
          // biome-ignore lint/suspicious/noArrayIndexKey: runs are positional by nature
          key={i}
          style={{ fontFamily: familyFor(run, mono, weight) }}
        >
          {run}
        </Text>
      ))}
    </Text>
  );
}

/** Split into maximal same-script runs so mixed Hindi/Latin lines render both correctly. */
function splitRuns(text: string): string[] {
  const runs: string[] = [];
  let current = '';
  let currentDeva: boolean | null = null;
  for (const ch of text) {
    const deva = DEVANAGARI.test(ch);
    if (currentDeva === null || deva === currentDeva) current += ch;
    else {
      runs.push(current);
      current = ch;
    }
    currentDeva = deva;
  }
  if (current) runs.push(current);
  return runs;
}

const styles = StyleSheet.create({
  base: { includeFontPadding: false } as TextStyle,
});
