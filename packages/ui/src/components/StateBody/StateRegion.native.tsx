import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { TONE } from '../../primitives/Tone/tone.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { EmptyScene } from '../EmptyScene/EmptyScene.native';
import type { StateRegionProps } from './StateBody.types';

type NativeStateRegionProps = StateRegionProps & { style?: StyleProp<ViewStyle> };

/** The centred form of a blocked surface that has room (`StateBody.types.ts`). */
export function StateRegion({
  tone,
  glyph,
  scene,
  title,
  message,
  action,
  style,
}: NativeStateRegionProps) {
  const warning = tone === 'warning';
  /* Its tint and ink are `TONE`'s; a neutral mark is the quiet tertiary ink. */
  const pair = warning ? TONE.warning : { ...TONE.neutral, ink: colors['text-tertiary'] };
  return (
    <View style={[styles.region, style]}>
      {scene === undefined ? (
        <View style={[styles.mark, { backgroundColor: pair.tint }]}>
          <ShellGlyph name={warning ? 'alert-circle' : glyph} size="lg" ink={pair.ink} />
        </View>
      ) : (
        <EmptyScene name={scene} />
      )}
      {title === undefined || title === null ? null : (
        <Text variant="h4" align="center">
          {title}
        </Text>
      )}
      {message === undefined || message === null ? null : (
        <Text variant="body-sm" color="secondary" align="center" style={styles.message}>
          {message}
        </Text>
      )}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  region: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-12'],
    paddingHorizontal: theme.spacing['sp-6'],
  },
  mark: {
    width: theme.spacing['sp-12'],
    height: theme.spacing['sp-12'],
    marginBottom: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { maxWidth: theme.layout['form-max'] * 0.75 },
});
