import { theme } from '@heliogrid/theme';
import { useCallback, useRef, useState } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { MapContent } from './MapContent.native';
import { MapStateLayer } from './MapStates.native';
import type { MapSurfaceProps } from './MapSurface.types';
import {
  imageryWords,
  isBlockedState,
  normalisePlacement,
  resolvePinState,
  toPercent,
} from './map-placement';
import { useMapZoom } from './use-map-zoom';

interface NativeMapSurfaceProps extends MapSurfaceProps {
  style?: StyleProp<ViewStyle>;
}

interface Frame {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors['surface-alt'],
    ...theme.elevation.e2,
  },
});

/**
 * Map frame for field workforce — routes, day playback, geofences, **address confirmation**.
 * Owns the frame, overlays, 44px controls, the placement interaction and the states; the tiles
 * come from your map library, passed as `children`.
 *
 * React Native is always a coarse pointer, so `placement.input: "auto"` resolves to the touch
 * reading here — and the split is additive, so the fixed pin and its pill stay.
 */
export function MapSurface({
  children,
  height = 320,
  radius,
  markers = [],
  route = null,
  geofences = [],
  accuracy = null,
  state = 'ready',
  emptyTitle = 'No sites to show',
  emptyMessage = 'Assign a job to a technician and their route appears here.',
  unavailableTitle = 'No map imagery for this area',
  unavailableMessage = 'This location has no tiles from our provider. The address and the recorded coordinates are still exact.',
  errorTitle = "Couldn't load the map",
  errorMessage = 'Tap Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  controls = true,
  onZoomIn,
  onZoomOut,
  onRecenter,
  pin = null,
  placement = null,
  onPlace,
  onPinMove,
  zoom,
  minZoom = 1,
  maxZoom = 22,
  onZoomChange,
  firstPinZoom = 20,
  showZoomLevel = true,
  imagery = null,
  overlay = null,
  attribution,
  style,
}: NativeMapSurfaceProps) {
  const rootRef = useRef<View>(null);
  const frame = useRef<Frame>({ pageX: 0, pageY: 0, width: 0, height: 0 });
  const [, setMeasured] = useState(0);

  const measure = useCallback(() => {
    rootRef.current?.measureInWindow((pageX, pageY, width, height_) => {
      frame.current = { pageX, pageY, width, height: height_ };
      setMeasured((n) => n + 1);
    });
  }, []);

  const place = normalisePlacement(placement, {
    coarse: true,
    canPlace: onPlace !== undefined,
    canDragPin: onPinMove !== undefined,
  });
  const blocked = isBlockedState(state);
  const pinState = resolvePinState(pin);
  const stepZoom = useMapZoom({
    zoom,
    minZoom,
    maxZoom,
    firstPinZoom,
    hasPin: pin !== null,
    onZoomChange,
    onZoomIn,
    onZoomOut,
  });

  /* A tap on the placement layer reports coordinates relative to that layer, so it needs no
     page origin; a pin drag reports page coordinates, which the measured frame converts. */
  const onTap = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    onPlace?.({
      x: toPercent(locationX, frame.current.width),
      y: toPercent(locationY, frame.current.height),
      source: 'tap',
    });
  };
  const onPinDrag = (pageX: number, pageY: number) => {
    onPinMove?.({
      x: toPercent(pageX - frame.current.pageX, frame.current.width),
      y: toPercent(pageY - frame.current.pageY, frame.current.height),
      source: 'pin-drag',
    });
  };

  const attributionText = imagery === null ? null : imageryWords(imagery);

  return (
    <View
      ref={rootRef}
      onLayout={measure}
      style={[
        styles.root,
        { height, borderRadius: typeof radius === 'number' ? radius : theme.radius['r-lg'] },
        style,
      ]}
    >
      {blocked ? null : (
        <MapContent
          markers={markers}
          route={route}
          geofences={geofences}
          accuracy={accuracy}
          place={place}
          pin={pin}
          pinState={pinState}
          onTap={onPlace === undefined ? undefined : onTap}
          onPinDrag={onPinDrag}
          canDragPin={onPinMove !== undefined}
          controls={controls}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          showZoomLevel={showZoomLevel}
          onStepZoom={stepZoom}
          onRecenter={onRecenter}
          attributionWords={attributionText}
          attribution={attribution}
          overlay={overlay}
        >
          {children}
        </MapContent>
      )}

      <MapStateLayer
        state={state}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        unavailableTitle={unavailableTitle}
        unavailableMessage={unavailableMessage}
        errorTitle={errorTitle}
        errorMessage={errorMessage}
        onRetry={onRetry}
      />
    </View>
  );
}
