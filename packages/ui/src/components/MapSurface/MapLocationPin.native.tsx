import { theme } from '@heliogrid/theme';
import { useMemo, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import type { MapPin } from './MapSurface.types';
import { MAP_PIN_COLOR } from './MapTokens.native';

interface MapLocationPinProps {
  pin: MapPin;
  pinState: 'pending' | 'confirmed';
  /** The pin rides the fixed centre until it has coordinates of its own. */
  fixed: boolean;
  draggable: boolean;
  /** Page coordinates of the finger; the surface turns them into percentages. */
  onDragTo: (pageX: number, pageY: number) => void;
}

const styles = StyleSheet.create({
  /* Zero-box anchor: the web half uses translate(-50%,-100%), which RN has no equivalent for
     on an auto-sized absolute view. */
  anchor: { position: 'absolute', width: 0, height: 0, alignItems: 'center', zIndex: 2 },
  column: { alignItems: 'center', gap: theme.spacing['sp-1'] },
  label: { ...theme.elevation.e2 },
  hit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.accent,
    opacity: 0.16,
  },
});

/**
 * PENDING vs CONFIRMED, **in words first**. Pending is an accent pin with a hollow core, a soft
 * halo and the words "Pin pending"; confirmed is a filled success pin with a tick and "Location
 * confirmed". Neither reading rests on the colour — the words carry it, and StatusMark adds the
 * non-colour glyph the DS requires of any state.
 */
export function MapLocationPin({ pin, pinState, fixed, draggable, onDragTo }: MapLocationPinProps) {
  const confirmed = pinState === 'confirmed';
  const colour = MAP_PIN_COLOR[pinState];
  const words = pin.label ?? (confirmed ? 'Location confirmed' : 'Pin pending');
  const drag = useRef(onDragTo);
  drag.current = onDragTo;
  const x = fixed ? 50 : (pin.x ?? 50);
  const y = fixed ? 50 : (pin.y ?? 50);

  /* Pointer capture on the web; the responder system here. Same event either way: the finger's
     position becomes a percentage on the surface. */
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => draggable,
        onMoveShouldSetPanResponder: () => draggable,
        onPanResponderMove: (event: GestureResponderEvent) => {
          drag.current(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
        onPanResponderRelease: (event: GestureResponderEvent) => {
          drag.current(event.nativeEvent.pageX, event.nativeEvent.pageY);
        },
      }),
    [draggable],
  );

  return (
    <View style={[styles.anchor, { left: `${x}%`, top: `${y}%` }]} pointerEvents="box-none">
      <View style={styles.column} pointerEvents="box-none">
        <StatusMark style={styles.label} tone={confirmed ? 'success' : 'accent'} label={words} />
        <View
          accessibilityRole="image"
          accessibilityLabel={draggable ? `${words}, draggable` : words}
          style={styles.hit}
          pointerEvents={draggable ? 'auto' : 'none'}
          {...(draggable ? responder.panHandlers : {})}
        >
          {confirmed ? null : <View style={styles.halo} />}
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"
              fill={confirmed ? colour : theme.colors.surface}
              stroke={colour}
              strokeWidth={1.8}
            />
            {confirmed ? (
              <Path
                d="M8.6 10.9l2.4 2.3 4-4.3"
                stroke={theme.colors.surface}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <Circle cx={12} cy={11} r={2.6} stroke={colour} strokeWidth={1.8} />
            )}
          </Svg>
        </View>
      </View>
    </View>
  );
}
