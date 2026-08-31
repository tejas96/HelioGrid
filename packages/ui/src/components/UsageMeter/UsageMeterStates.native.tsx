import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { DimensionValue, TextStyle } from 'react-native';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { UsageMeterProps } from './UsageMeter.types';

/**
 * A shimmer in the figure's OWN footprint — never a numeral, never a dash dressed as a value.
 *
 * The web half sweeps a gradient across the block (`hg-sheet-shimmer`); RN has no animatable
 * background-position, so the same "still being read" signal is a breathing tint over the same
 * footprint. The footprint is what carries the meaning; the sweep was only its motion.
 */
export function Shimmer({
  width,
  height,
  radius,
}: {
  width: DimensionValue;
  height: number;
  radius: number;
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.colors['canvas-sunken'] },
        { opacity },
      ]}
    />
  );
}

const label: TextStyle = {
  fontSize: 14,
  fontWeight: '500',
  letterSpacing: -0.14,
  color: theme.colors['text-primary'],
};

function Head({ label: words, period }: { label: string; period?: string }) {
  return (
    <View style={styles.head}>
      <Text style={label}>{words}</Text>
      {period !== undefined ? (
        <Text variant="caption" color="tertiary">
          {period}
        </Text>
      ) : null}
    </View>
  );
}

/** RULE 3 — AN ERROR SHOWS NO NUMBERS. Not the last good figure, not an approximation. */
export function UsageMeterError({
  label: words,
  period,
  errorMessage,
  onRetry,
}: Pick<UsageMeterProps, 'label' | 'period' | 'onRetry'> & { errorMessage: string }) {
  return (
    <View style={styles.shell}>
      <Head label={words} period={period} />
      <Text variant="caption" color="warning" style={styles.emphasis}>
        {errorMessage}
      </Text>
      {onRetry !== undefined ? (
        <View style={styles.retry}>
          <Pressable style={styles.pill} onPress={onRetry}>
            <Text style={label}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** This meter does not apply to this plan: no bar, no figure, NO RETRY. */
export function UsageMeterUnavailable({
  label: words,
  period,
  unavailableTitle,
  unavailableMessage,
}: Pick<UsageMeterProps, 'label' | 'period' | 'unavailableMessage'> & {
  unavailableTitle: string;
}) {
  return (
    <View style={styles.shell}>
      <Text style={label}>{words}</Text>
      <UnavailableNote title={unavailableTitle} message={unavailableMessage} detail={period} />
    </View>
  );
}

/** RULE 1 — NO FIGURE WITHOUT A RESOLVED VALUE. No numeral, no zero, no progressbar role. */
export function UsageMeterLoading({
  label: words,
  period,
  loadingNote,
  trackHeight,
}: Pick<UsageMeterProps, 'label' | 'period'> & { loadingNote: string; trackHeight: number }) {
  const line = [loadingNote, period].filter((part) => part !== undefined).join(' · ');
  /* `accessibilityLiveRegion="polite"` is RN's `role="status"`, and it is what web's section
     carries. The label that sat beside it was announced by nothing, and it was a SHORTER retelling
     of the two Texts below — the meter's name, then "Not resolved yet — this period's rollup is
     still being read. · This month". Giving the view a role to make the label speak would fold
     those children away and announce less, so the redundant label goes and the children stay. */
  return (
    <View accessibilityLiveRegion="polite" style={styles.shell}>
      <View style={styles.head}>
        <Text style={label}>{words}</Text>
        <Shimmer width={92} height={13} radius={theme.radius['rf-md']} />
      </View>
      <Shimmer width="100%" height={trackHeight} radius={theme.radius['r-pill']} />
      <Text variant="caption" color="tertiary">
        {line}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: theme.spacing['sp-2'] },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  emphasis: { fontWeight: '500' },
  retry: { flexDirection: 'row' },
  pill: {
    paddingHorizontal: 18,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
});
