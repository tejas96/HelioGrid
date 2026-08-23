/* ReorderList's control button (native).

   `disabled` here means ARIA-disabled, NEVER a dead control. The end arrows are the buttons with
   something to say ("is already first"), and a control that cannot be pressed can announce nothing
   — so this target stays pressable, moves nothing, and says why.

   That is why it is an RN Pressable rather than the Pressable primitive, whose `disabled` also
   stops the press. The 44px floor is kept by reading MIN_TOUCH_TARGET from that same primitive, so
   there is still one number for the whole system. */

import { theme } from '@heliogrid/theme';
import type { Ref } from 'react';
import type { PressableStateCallbackType, View } from 'react-native';
import { Pressable as RNPressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable';
import type { ReorderGlyph } from './ReorderList.defaults';
import { REORDER_GLYPHS } from './ReorderList.defaults';

const styles = StyleSheet.create({
  control: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius['r-pill'],
  },
  pressedNeutral: { backgroundColor: theme.colors['neutral-bg'] },
  pressedDanger: { backgroundColor: theme.colors['danger-bg'] },
});

const COLOR = {
  neutral: theme.colors['text-secondary'],
  danger: theme.colors['danger-text'],
  disabled: theme.colors['text-disabled'],
};

export function ReorderControl({
  kind,
  label,
  disabled,
  onPress,
  tone = 'neutral',
  controlRef,
}: {
  kind: ReorderGlyph;
  label: string;
  disabled?: boolean;
  onPress: () => void;
  tone?: 'neutral' | 'danger';
  controlRef?: Ref<View>;
}) {
  const stroke = disabled ? COLOR.disabled : COLOR[tone];
  return (
    <RNPressable
      ref={controlRef}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={onPress}
      style={(state: PressableStateCallbackType) => [
        styles.control,
        state.pressed && !disabled
          ? tone === 'danger'
            ? styles.pressedDanger
            : styles.pressedNeutral
          : undefined,
      ]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d={REORDER_GLYPHS[kind]}
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </RNPressable>
  );
}
