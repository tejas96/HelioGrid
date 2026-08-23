import { theme } from '@heliogrid/theme';
import { useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { clampToRange } from './slider-math';

const THUMB = 22;

interface SliderTrackProps {
  disabled: boolean;
  label?: string;
  max: number;
  min: number;
  /** Commit signal — fires ONCE, when the drag ends. */
  onCommit: (value: number) => void;
  /** Live signal — fires on every frame of the drag. */
  onLive: (value: number) => void;
  /** One step either way, for the assistive increment/decrement actions. */
  onNudge: (direction: number) => void;
  percent: number;
  shown: string;
  step: number;
  value: number;
}

/**
 * The 44dp band. Web's `<input type="range">` has no RN counterpart, so this is a responder
 * surface — a continuous drag is not a press, which is why this one interactive surface does not
 * go through the Pressable primitive; it keeps the 44dp floor itself. `accessibilityRole
 * "adjustable"` plus the increment/decrement actions are the keyboard contract's stand-in.
 *
 * `--track-edge` is a web field-mode custom property with no RN counterpart, so the rail carries
 * no edge here.
 */
export function SliderTrack({
  disabled,
  label,
  max,
  min,
  onCommit,
  onLive,
  onNudge,
  percent,
  shown,
  step,
  value,
}: SliderTrackProps) {
  const [width, setWidth] = useState(0);
  const lastRef = useRef(value);

  const touch = (event: GestureResponderEvent) => {
    if (width <= 0) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
    const next = clampToRange(min + ratio * (max - min), min, max, step);
    lastRef.current = next;
    onLive(next);
  };

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value, text: shown }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        onNudge(event.nativeEvent.actionName === 'decrement' ? -1 : 1)
      }
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderGrant={touch}
      onResponderMove={touch}
      onResponderRelease={() => onCommit(lastRef.current)}
    >
      <View style={styles.rail} />
      <View
        style={[styles.fill, { width: `${percent}%` }, disabled ? styles.fillDisabled : undefined]}
      />
      <View
        style={[styles.thumb, { left: `${percent}%` }, disabled ? styles.thumbDisabled : undefined]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* The band is 44 tall and the rail is 6 inside it, so a thumb on a roof is grabbable anywhere. */
  track: {
    flex: 1,
    minWidth: 0,
    height: 44,
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 19,
    height: 6,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 19,
    height: 6,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.accent,
  },
  fillDisabled: {
    backgroundColor: theme.colors['text-disabled'],
  },
  thumb: {
    position: 'absolute',
    top: 11,
    width: THUMB,
    height: THUMB,
    marginLeft: -THUMB / 2,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    ...theme.elevation.e3,
  },
  thumbDisabled: {
    borderColor: theme.colors['text-disabled'],
    ...theme.elevation.e1,
  },
});
