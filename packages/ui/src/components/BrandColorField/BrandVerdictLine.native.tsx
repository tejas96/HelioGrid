import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../primitives/Text/Text.native';
import type { BrandVerdictKind } from './BrandColorField.types';
import { VERDICT_PATH } from './BrandVerdictLine.logic';

const COLOR: Record<BrandVerdictKind, string> = {
  pass: theme.colors['success-text'],
  warn: theme.colors['warning-text'],
  info: theme.colors['text-secondary'],
};

const TONE: Record<BrandVerdictKind, 'success' | 'warning' | 'secondary'> = {
  pass: 'success',
  warn: 'warning',
  info: 'secondary',
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  glyph: { marginTop: 1 },
  words: { flex: 1, minWidth: 0 },
});

interface BrandVerdictLineProps {
  kind: BrandVerdictKind;
  children: string;
}

/** One verdict: a GLYPH plus the words — never a coloured dot alone (F7-12). */
export function BrandVerdictLine({ kind, children }: BrandVerdictLineProps) {
  return (
    <View style={styles.row}>
      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={styles.glyph}>
        <Path
          d={VERDICT_PATH[kind]}
          stroke={COLOR[kind]}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={styles.words}>
        <Text variant="caption" color={TONE[kind]}>
          {children}
        </Text>
      </View>
    </View>
  );
}
