import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import { axisFootOf } from './CompareGrid.logic';
import type { CompareGridFooterProps } from './CompareGrid.types';

const styles = StyleSheet.create({
  foot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: theme.spacing['sp-4'],
    paddingTop: 10,
    paddingBottom: theme.spacing['sp-3'],
  },
  steps: { flexDirection: 'row', gap: theme.spacing['sp-1'] },
  step: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
});

function Chevron({ back, disabled }: { back?: boolean; disabled: boolean }) {
  const stroke = disabled ? theme.colors['text-disabled'] : theme.colors['text-primary'];
  return (
    <View style={back === true ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <Icon size="lg" color={stroke}>
        <Svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ShellGlyphMarks name="chevron-right" />
        </Svg>
      </Icon>
    </View>
  );
}

/**
 * **Where the reader is on the option axis, and how they move along it without a swipe.**
 *
 * The readout and the previous/next controls answer the same question, so they are one component:
 * both appear only while the axis actually overflows, and the footer stays for a caller's `note`
 * alone.
 */
export function CompareGridFooter({ onStep, words, ...position }: CompareGridFooterProps) {
  const foot = axisFootOf(position, words);
  if (foot === null) return null;
  return (
    <View style={styles.foot}>
      <Text variant="caption" color="tertiary">
        {foot.readout}
      </Text>
      {position.scrollable ? (
        <View style={styles.steps}>
          <Pressable
            accessibilityLabel={words.previousOption}
            disabled={foot.atFirst}
            onPress={() => onStep(-1)}
            style={styles.step}
          >
            <Chevron back disabled={foot.atFirst} />
          </Pressable>
          <Pressable
            accessibilityLabel={words.nextOption}
            disabled={foot.atLast}
            onPress={() => onStep(1)}
            style={styles.step}
          >
            <Chevron disabled={foot.atLast} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
