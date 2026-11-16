import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { ProvenanceTier } from '../Provenance/Provenance.native';
import type { BrandVerdictKind } from './BrandColorField.types';
import { VERDICT_GLYPH } from './BrandVerdictLine.logic';

interface BrandVerdictLineProps {
  kind: BrandVerdictKind;
  children: string;
}

/** One full verdict: a GLYPH plus the words and the ratio's tier — never a coloured dot alone (F7-12). */
export function BrandVerdictLine({ kind, children }: BrandVerdictLineProps) {
  return (
    <View style={styles.row}>
      <View style={styles.glyph}>
        <ShellGlyph name={VERDICT_GLYPH[kind]} size="dense" ink={COLOR[kind]} />
      </View>
      <View style={styles.words}>
        <Text variant="caption" color={VERDICT_COLOR[kind]}>
          {children}
        </Text>
        <ProvenanceTier tier="derived" />
      </View>
    </View>
  );
}

const COLOR: Record<BrandVerdictKind, ThemeColor> = {
  pass: TONE.success.ink,
  warn: TONE.warning.ink,
  info: colors['text-secondary'],
};

const VERDICT_COLOR: Record<BrandVerdictKind, 'success' | 'warning' | 'secondary'> = {
  pass: 'success',
  warn: 'warning',
  info: 'secondary',
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing['sp-1'] },
  glyph: { marginTop: 1 },
  words: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
});
