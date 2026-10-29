import { theme } from '@heliogrid/theme';
import { useMemo, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { PanResponder, StyleSheet, View } from 'react-native';
import { G, Svg } from 'react-native-svg';
import { StatusMark } from '../../primitives/StatusMark/StatusMark.native';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks.native';
import type { MapPin, MapSurfaceWords } from './MapSurface.types';
import { MAP_PIN_COLOR } from './MapTokens.native';
import { pinReadingOf } from './map-placement';

interface MapLocationPinProps {
  pin: MapPin;
  pinState: 'pending' | 'confirmed';
  /** The pin rides the fixed centre until it has coordinates of its own. */
  fixed: boolean;
  draggable: boolean;
  /** Page coordinates of the finger; the surface turns them into percentages. */
  onDragTo: (pageX: number, pageY: number) => void;
  words: Pick<MapSurfaceWords, 'pinPending' | 'pinConfirmed' | 'draggable'>;
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
export function MapLocationPin({
  pin,
  pinState,
  fixed,
  draggable,
  onDragTo,
  words,
}: MapLocationPinProps) {
  const { confirmed, name, spokenName, x, y } = pinReadingOf(
    pin,
    pinState,
    fixed,
    draggable,
    words,
  );
  const colour = MAP_PIN_COLOR[pinState];
  const drag = useRef(onDragTo);
  drag.current = onDragTo;

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
        <StatusMark style={styles.label} tone={confirmed ? 'success' : 'accent'} label={name} />
        <View
          accessibilityRole="image"
          accessibilityLabel={spokenName}
          style={styles.hit}
          pointerEvents={draggable ? 'auto' : 'none'}
          {...(draggable ? responder.panHandlers : {})}
        >
          {confirmed ? null : <View style={styles.halo} />}
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <G
              // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
              fill={confirmed ? colour : theme.colors.surface}
              stroke={colour}
              strokeWidth={1.8}
            >
              <ShellGlyphMarks name="pin" />
            </G>
            {confirmed ? (
              <G
                // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
                stroke={theme.colors.surface}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <ShellGlyphMarks name="pin-tick" />
              </G>
            ) : (
              <G stroke={colour} strokeWidth={1.8}>
                <ShellGlyphMarks name="pin-hole" />
              </G>
            )}
          </Svg>
        </View>
      </View>
    </View>
  );
}
