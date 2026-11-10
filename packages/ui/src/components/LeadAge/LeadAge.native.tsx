import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { leadAgeStandingOf } from './LeadAge.logic';
import type { LeadAgeProps } from './LeadAge.types';

interface NativeLeadAgeProps extends LeadAgeProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * A waiting lead's age (`M02-24`). Past 24 hours it is a warning mark — glyph, word and tint —
 * and in the last quarter before, the clock takes the warning ink. One accessibility element that
 * speaks the whole sentence, never "5 h".
 */
export function LeadAge({ elapsedMs, words, style }: NativeLeadAgeProps) {
  const standing = leadAgeStandingOf(elapsedMs);
  const age = words.age(elapsedMs);
  return (
    <View accessible accessibilityLabel={words.spoken(elapsedMs)} style={[styles.age, style]}>
      {standing === 'past' ? (
        <StatusMark tone="warning" label={age} />
      ) : (
        <>
          <ShellGlyph
            name="clock"
            size="sm"
            tone={standing === 'nearing' ? 'warning' : 'secondary'}
          />
          <Text variant="body-sm" color="secondary">
            {age}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  age: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'], flexShrink: 0 },
});
