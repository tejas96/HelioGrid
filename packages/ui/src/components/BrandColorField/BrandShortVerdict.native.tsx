import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { Button } from '../Button/Button.native';
import type { BrandShortVerdictProps, BrandVerdictKind } from './BrandColorField.types';
import { VERDICT_GLYPH } from './BrandVerdictLine.logic';

/**
 * `verdict="short"` — one line beside a glyph disc, never the tint alone (F7-12); a failing colour
 * gets its derived ink as a quiet tile row with a secondary act. Same contract as the web half.
 */
export function BrandShortVerdict({
  verdict,
  fixHex,
  words,
  onUse,
  disabled,
}: BrandShortVerdictProps) {
  return (
    <View style={styles.column}>
      <View style={styles.line}>
        <View style={[styles.disc, { backgroundColor: DISC[verdict.kind].ground }]}>
          <Svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke={DISC[verdict.kind].ink}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <ShellGlyphMarks name={VERDICT_GLYPH[verdict.kind]} />
          </Svg>
        </View>
        <View style={styles.words}>
          <Text variant="body-sm">{verdict.sentence}</Text>
        </View>
      </View>
      {fixHex === null ? null : (
        <InkRow hex={fixHex} words={words} onUse={onUse} disabled={disabled} />
      )}
    </View>
  );
}

function InkRow({
  hex,
  words,
  onUse,
  disabled,
}: Pick<BrandShortVerdictProps, 'words' | 'onUse' | 'disabled'> & { hex: string }) {
  const { before, after } = words.inkWords(hex);
  return (
    <View style={[tileSurface, styles.ink]}>
      <GroundProvider ground="tile">
        {/* The ink is tenant DATA — inline is the only honest place for it. */}
        <View style={[styles.inkSwatch, { backgroundColor: hex }]} />
        <View style={styles.words}>
          <Text variant="body-sm" bold>
            {before}
            <Text variant="mono" bold>
              {hex}
            </Text>
            {after}
          </Text>
          <Text variant="caption" color="secondary">
            {words.caption}
          </Text>
        </View>
        <Button variant="secondary" size="sm" disabled={disabled} onClick={onUse}>
          {words.act}
        </Button>
      </GroundProvider>
    </View>
  );
}

const DISC: Record<BrandVerdictKind, { ink: string; ground: string }> = {
  pass: { ink: theme.colors['success-text'], ground: theme.colors['success-bg'] },
  warn: { ink: theme.colors['warning-text'], ground: theme.colors['warning-bg'] },
  info: { ink: theme.colors['text-secondary'], ground: theme.colors.fill },
};

const DISC_SIZE = 22;
const INK_SWATCH = 28;

const styles = StyleSheet.create({
  column: { gap: 10 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  disc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: { flex: 1, minWidth: 0 },
  ink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-lg'],
  },
  inkSwatch: {
    width: INK_SWATCH,
    height: INK_SWATCH,
    borderRadius: INK_SWATCH / 2,
    flexShrink: 0,
  },
});
