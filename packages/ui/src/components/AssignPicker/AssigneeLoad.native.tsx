import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { AssigneeLoadProps } from './AssignPicker.types';

/**
 * One person's load (`M02-28`): open leads, overdue tasks — with the warning glyph when any are
 * overdue, so you do not bury someone — and a bar of their share of the busiest load, grown once
 * on the UI thread. The bar repeats the words and is hidden from a screen reader.
 */
export function AssigneeLoad({ openCount, overdueCount, share, words }: AssigneeLoadProps) {
  const late = overdueCount > 0;
  return (
    <View style={styles.load}>
      <View style={styles.counts}>
        <Text variant="body-sm" color="secondary">
          {words.open(openCount)}
        </Text>
        <View style={styles.overdue}>
          {late ? <ShellGlyph name="alert-triangle" size="sm" tone="warning" /> : null}
          <Text variant="body-sm" color={late ? 'warning' : 'secondary'}>
            {words.overdue(overdueCount)}
          </Text>
        </View>
      </View>
      <LoadBar share={share} />
    </View>
  );
}

/** The share fills from the bar's start once; at once under reduced motion. */
function LoadBar({ share }: { share: number }) {
  const reduced = useReducedMotion();
  const grown = useRef(new Animated.Value(reduced ? share : 0)).current;
  useEffect(() => {
    if (reduced) {
      grown.setValue(share);
      return;
    }
    const grow = Animated.timing(grown, {
      toValue: share,
      duration: theme.motion.durations.data,
      easing: Easing.bezier(...theme.motion.easings.enter),
      useNativeDriver: true,
    });
    grow.start();
    return () => grow.stop();
  }, [grown, reduced, share]);
  return (
    <View style={styles.bar} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.fill, { transform: [{ scaleX: grown }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  load: { gap: theme.spacing['sp-1'], alignSelf: 'stretch' },
  counts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-3'],
  },
  overdue: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-1'] },
  bar: {
    height: theme.spacing['sp-1'],
    overflow: 'hidden',
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
  /* The fill grows from the bar's start, as the web's `transform-origin: left`. */
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors.accent,
    transformOrigin: 'left center',
  },
});
