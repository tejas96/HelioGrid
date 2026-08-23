import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import type { MapMarker } from './MapSurface.types';
import { MAP_TONE } from './MapTokens.native';
import { markerLabel } from './map-placement';

const PULSE_MS = 2000;

const styles = StyleSheet.create({
  /* The web half centres on the point with translate(-50%,-50%). RN sizes an absolute view to
     its content, so a zero-box anchor plus alignItems does the same job without percentages. */
  marker: { position: 'absolute', width: 0, height: 0, alignItems: 'center' },
  column: { alignItems: 'center', gap: theme.spacing['sp-1'], marginTop: -22 },
  hit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.surface,
    borderWidth: 2.5,
    ...theme.elevation.e2,
  },
  dotLive: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  chip: {
    paddingVertical: theme.spacing['sp-0-5'],
    paddingHorizontal: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e2,
  },
  chipText: { fontWeight: '500' },
});

/* The web half runs `hg-map-pulse` from the stylesheet, which the reduced-motion query drops.
   RN has no media query, so the same ruling is read from AccessibilityInfo. */
function Pulse({ color }: { color: string }) {
  const value = useRef(new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value.current, {
        toValue: 1,
        duration: PULSE_MS,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    let cancelled = false;
    const start = async () => {
      const reduced = await AccessibilityInfo.isReduceMotionEnabled();
      if (!reduced && !cancelled) {
        loop.start();
      }
    };
    void start();
    return () => {
      cancelled = true;
      loop.stop();
    };
  }, []);

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
}: MapMarker) {
  const colour = MAP_TONE[tone];
  const stale = !live;
  const chip = label !== undefined || (stale && lastSeen !== undefined);

  return (
    <View style={[styles.marker, { left: `${x}%`, top: `${y}%` }]}>
      <View style={styles.column}>
        <Pressable
          accessibilityLabel={markerLabel(label, live, lastSeen)}
          onPress={onClick}
          style={styles.hit}
        >
          {live ? <Pulse color={colour} /> : null}
          <View
            style={[
              styles.dot,
              live ? styles.dotLive : undefined,
              { borderColor: theme.colors.surface },
              live ? { backgroundColor: colour } : { borderColor: colour },
            ]}
          />
        </Pressable>
        {chip ? (
          <View style={styles.chip}>
            <Text variant="caption" color={stale ? 'secondary' : 'primary'} style={styles.chipText}>
              {`${label ?? ''}${stale && lastSeen !== undefined ? ` · last seen ${lastSeen}` : ''}`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
