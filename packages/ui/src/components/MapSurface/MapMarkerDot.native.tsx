import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { Animated, AppState, Easing, StyleSheet, View } from 'react-native';
import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { useReducedMotion } from '../../primitives/use-reduced-motion';
import type { MapMarker } from './MapSurface.types';
import { MAP_TONE } from './MapTokens.native';
import { type MarkerWords, markerChipOf, markerLabel } from './map-placement';

const styles = StyleSheet.create({
  /* The web half centres on the point with translate(-50%,-50%). RN sizes an absolute view to
     its content, so a zero-box anchor plus alignItems does the same job without percentages. */
  marker: { position: 'absolute', width: 0, height: 0, alignItems: 'center' },
  column: { alignItems: 'center', gap: theme.spacing['sp-1'], marginTop: -22 },
  hit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 16, height: 16, borderRadius: theme.radius['rf-md'] },
  dot: {
    width: 14,
    height: 14,
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    ...theme.elevation.e2,
  },
  dotLive: { width: 16, height: 16, borderRadius: theme.radius['rf-md'], borderWidth: 3 },
  chip: {
    paddingVertical: theme.spacing['sp-0-5'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: colors.surface,
    ...theme.elevation.e2,
  },
  chipText: { fontWeight: '500' },
});

/* The web half runs `hg-map-pulse` from the stylesheet, which the reduced-motion query drops; the
   phone reads the same ruling through the shared hook, stills the ring at rest, and stops the loop
   while the app is in the background. */
function Pulse({ color }: { color: ThemeColor }) {
  const value = useRef(new Animated.Value(0));
  const reduced = useReducedMotion();

  useEffect(() => {
    const ring = value.current;
    if (reduced) {
      ring.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: theme.motion.ambient.beacon,
        easing: Easing.bezier(...theme.motion.easings.standard),
        useNativeDriver: true,
      }),
    );
    loop.start();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') loop.start();
      else loop.stop();
    });
    return () => {
      app.remove();
      loop.stop();
    };
  }, [reduced]);

  const scale = value.current.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 2.4, 2.4] });
  const opacity = value.current.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.45, 0, 0],
  });

  return (
    <Animated.View
      style={[styles.pulse, { backgroundColor: color, opacity, transform: [{ scale }] }]}
    />
  );
}

/**
 * **A live position never looks like a stale one.** Live markers are filled and pulse;
 * last-known markers are hollow rings labelled "last seen 10:42 AM" — and the difference is in
 * the accessible name too, not only in the shape.
 */
export function MapMarkerDot({
  x = 50,
  y = 50,
  tone = 'accent',
  live = false,
  lastSeen,
  label,
  onClick,
  words,
}: MapMarker & { words: MarkerWords }) {
  const colour = MAP_TONE[tone];
  const stale = !live;
  const chip = markerChipOf(label, live, lastSeen, words);

  return (
    <View style={[styles.marker, { left: `${x}%`, top: `${y}%` }]}>
      <View style={styles.column}>
        <Pressable
          accessibilityLabel={markerLabel(label, live, lastSeen, words)}
          onPress={onClick}
          style={styles.hit}
        >
          {live ? <Pulse color={colour} /> : null}
          <View
            style={[
              styles.dot,
              live ? styles.dotLive : undefined,
              // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
              { borderColor: colors.surface },
              live ? { backgroundColor: colour } : { borderColor: colour },
            ]}
          />
        </Pressable>
        {chip === null ? null : (
          <View style={styles.chip}>
            <Text variant="caption" color={stale ? 'secondary' : 'primary'} style={styles.chipText}>
              {chip}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
