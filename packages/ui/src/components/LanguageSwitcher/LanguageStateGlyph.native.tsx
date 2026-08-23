import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { LanguageContentState } from './LanguageSwitcher.types';

const styles = StyleSheet.create({
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  ring: { borderWidth: 1.5, backgroundColor: 'transparent' },
});

interface LanguageStateGlyphProps {
  state: LanguageContentState;
  active: boolean;
}

/**
 * The second channel (F7-12 / N6): a filled mark for authored, the layers glyph for inherited — the
 * same mark the per-section attribution line uses — and a hollow ring for nothing written.
 */
export function LanguageStateGlyph({ state, active }: LanguageStateGlyphProps) {
  const colour = active
    ? theme.colors['text-inverse']
    : state === 'authored'
      ? theme.colors.accent
      : theme.colors['text-tertiary'];

  if (state === 'inherited') {
    return (
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3 3 8l9 5 9-5-9-5Z" stroke={colour} strokeWidth={1.5} strokeLinejoin="round" />
        <Path
          d="m3 14 9 5 9-5"
          stroke={colour}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (state === 'empty') {
    return <View style={[styles.dot, styles.ring, { borderColor: colour }]} />;
  }
  return <View style={[styles.dot, { backgroundColor: colour }]} />;
}
