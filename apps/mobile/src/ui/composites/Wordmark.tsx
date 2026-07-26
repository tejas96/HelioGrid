import { theme } from '@heliogrid/tokens/theme';
import type { TextStyle } from 'react-native';
import { AppText } from '../AppText';

/**
 * "HelioGrid" brand wordmark — Geist Bold, "Grid" carries the brand colour. The web
 * clips --gradient-brand onto the glyphs; RN has no background-clip:text and MaskedView
 * would be a new native dep, so "Grid" renders solid --iris-violet (documented fallback).
 * Geometry is brand-asset constants (login.md: 22px / 700 / −0.02em / lh 1), not
 * type-scale roles.
 */
export interface WordmarkProps {
  size?: 'sm' | 'md';
  style?: TextStyle;
}

const SIZES = { sm: 16, md: 22 } as const;

export function Wordmark({ size = 'md', style }: WordmarkProps) {
  const fs = SIZES[size];
  const text: TextStyle = { fontSize: fs, lineHeight: fs, letterSpacing: fs * -0.02 };
  return (
    <AppText weight="700" style={{ ...text, ...style }}>
      Helio
      <AppText weight="700" color={theme.colors['iris-violet']} style={text}>
        Grid
      </AppText>
    </AppText>
  );
}
