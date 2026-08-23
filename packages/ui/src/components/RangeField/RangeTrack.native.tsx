import { theme } from '@heliogrid/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { formatEnd, roundToStep } from './RangeField.logic';

export interface RangeTrackProps {
  lo: number;
  hi: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  label?: string;
  unit?: string;
  format?: (value: number) => string;
  /** `live` true while the finger is down, false on release — the same split as the web half. */
  onDrag: (end: 'lo' | 'hi', value: number, live: boolean) => void;
}

const THUMB = 22;
/* The rail is 24px tall on the web; a finger needs 44, so the responder area is 44 and the rail
   stays centred inside it. The drawn control does not change — only what can be grabbed. */
const TRACK_H = 44;

const styles = StyleSheet.create({
  track: { height: TRACK_H, justifyContent: 'center' },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
  fill: { position: 'absolute', height: 6, borderRadius: theme.radius['r-pill'] },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    ...theme.elevation.e3,
  },
  thumbDisabled: { borderColor: theme.colors['text-disabled'], shadowOpacity: 0, elevation: 0 },
});

/**
 * The coarse gesture. RN has no `<input type="range">`, so the rail is a PanResponder: the
 * nearer thumb is captured on touch-down and follows the finger until release.
 *
 * A thumb is a drag surface, not a press target, so it cannot go through the `Pressable`
 * primitive — the responder area is 44px tall instead, which is the law Pressable holds.
 */
export function RangeTrack({
  lo,
  hi,
  min,
  max,
  step,
  disabled,
  label,
  unit,
  format,
  onDrag,
}: RangeTrackProps) {
  const [width, setWidth] = useState(0);
  const geo = useRef({ lo, hi, width: 0 });
  const held = useRef<{ end: 'lo' | 'hi'; from: number }>({ end: 'lo', from: min });

  useEffect(() => {
    geo.current = { lo, hi, width };
  }, [lo, hi, width]);

  const span = max - min || 1;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (e) => {
          const { lo: l, hi: h, width: w } = geo.current;
          const at = w > 0 ? min + (e.nativeEvent.locationX / w) * span : l;
          const end = Math.abs(at - l) <= Math.abs(at - h) ? 'lo' : 'hi';
          held.current = { end, from: end === 'lo' ? l : h };
        },
        onPanResponderMove: (_e, g) => {
          const { width: w } = geo.current;
          if (w <= 0) return;
          const next = held.current.from + (g.dx / w) * span;
          onDrag(held.current.end, roundToStep(next, step), true);
        },
        onPanResponderRelease: (_e, g) => {
          const { width: w } = geo.current;
          if (w <= 0) return;
          const next = held.current.from + (g.dx / w) * span;
          onDrag(held.current.end, roundToStep(next, step), false);
        },
      }),
    [disabled, min, span, step, onDrag],
  );

  const pos = (v: number) =>
    Math.max(0, Math.min(1, (v - min) / span)) * Math.max(0, width - THUMB);
  const nudge = (end: 'lo' | 'hi', direction: 1 | -1) => {
    const v = (end === 'lo' ? lo : hi) + direction * step;
    onDrag(end, roundToStep(Math.max(min, Math.min(max, v)), step), false);
  };

  const thumbs = [
    { key: 'lo' as const, value: lo, name: `${label ?? 'Range'} — lower end` },
    { key: 'hi' as const, value: hi, name: `${label ?? 'Range'} — upper end` },
  ];

  return (
    <View
      style={styles.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <View style={styles.rail} />
      <View
        style={[
          styles.fill,
          {
            left: pos(lo) + THUMB / 2,
            width: Math.max(0, pos(hi) - pos(lo)),
            backgroundColor: disabled ? theme.colors['text-disabled'] : theme.colors.accent,
          },
        ]}
      />
      {thumbs.map((t) => (
        <View
          key={t.key}
          style={[styles.thumb, disabled ? styles.thumbDisabled : null, { left: pos(t.value) }]}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t.name}
          accessibilityValue={{ min, max, now: t.value, text: formatEnd(t.value, format, unit) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'increment') nudge(t.key, 1);
            else if (e.nativeEvent.actionName === 'decrement') nudge(t.key, -1);
          }}
        />
      ))}
    </View>
  );
}
