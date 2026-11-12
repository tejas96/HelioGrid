import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { FoldHeadProps } from './FoldHead.types';

/** A card's head as its one toggle on the phone: name, standing, marks, and the chevron. */
export function FoldHead({ title, meta, aside, open, onToggle }: FoldHeadProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={styles.head}
    >
      <Text variant="h3">{title}</Text>
      {meta === undefined ? null : (
        <Text variant="caption" color="secondary">
          {meta}
        </Text>
      )}
      <View style={styles.end}>
        {aside === undefined ? null : (
          <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {aside}
          </View>
        )}
        <Chevron open={open} />
      </View>
    </Pressable>
  );
}

/**
 * The chevron turns over the motion tokens on the UI thread, as the web half's does; under reduced
 * motion it stands at its end at once.
 */
function Chevron({ open }: { open: boolean }) {
  const reduced = useReducedMotion();
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    const to = open ? 1 : 0;
    if (reduced) {
      turn.setValue(to);
      return;
    }
    const run = Animated.timing(turn, {
      toValue: to,
      duration: theme.motion.durations.standard,
      easing: Easing.bezier(...theme.motion.easings.standard),
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [open, reduced, turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <ShellGlyph name="caret-down" size="sm" tone="secondary" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  end: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    marginLeft: 'auto',
  },
});
