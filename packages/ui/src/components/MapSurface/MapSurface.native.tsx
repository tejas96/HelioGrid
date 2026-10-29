import { theme } from '@heliogrid/theme';
import { useCallback, useRef, useState } from 'react';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { MapContent } from './MapContent.native';
import { MapStateLayer } from './MapStates.native';
import type { MapSurfaceProps } from './MapSurface.types';
import { toPercent } from './map-placement';
import { useMapView } from './use-map-view';

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
export function MapSurface(props: NativeMapSurfaceProps) {
  const { style } = props;
  const { map, state, onRetry, blocked, place, pinState, stepZoom, attributionWords } = useMapView(
    props,
    true,
  );
  const rootRef = useRef<View>(null);
  const frame = useRef<Frame>({ pageX: 0, pageY: 0, width: 0, height: 0 });
  const [, setMeasured] = useState(0);

  const measure = useCallback(() => {
    rootRef.current?.measureInWindow((pageX, pageY, width, height_) => {
      frame.current = { pageX, pageY, width, height: height_ };
      setMeasured((n) => n + 1);
    });
  }, []);

  /* A tap on the placement layer reports coordinates relative to that layer, so it needs no
     page origin; a pin drag reports page coordinates, which the measured frame converts. */
  const onTap = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    map.onPlace?.({
      x: toPercent(locationX, frame.current.width),
      y: toPercent(locationY, frame.current.height),
      source: 'tap',
    });
  };
  const onPinDrag = (pageX: number, pageY: number) => {
    map.onPinMove?.({
      x: toPercent(pageX - frame.current.pageX, frame.current.width),
      y: toPercent(pageY - frame.current.pageY, frame.current.height),
      source: 'pin-drag',
    });
  };

  return (
    <View
      ref={rootRef}
      onLayout={measure}
      style={[
        styles.root,
        {
          height: map.height,
          borderRadius: typeof map.radius === 'number' ? map.radius : theme.radius['r-lg'],
        },
        style,
      ]}
    >
      {blocked ? null : (
        <MapContent
          markers={map.markers}
          route={map.route}
          geofences={map.geofences}
          accuracy={map.accuracy}
          place={place}
          pin={map.pin}
          pinState={pinState}
          onTap={map.onPlace === undefined ? undefined : onTap}
          onPinDrag={onPinDrag}
          canDragPin={map.onPinMove !== undefined}
          controls={map.controls}
          zoom={map.zoom}
          minZoom={map.minZoom}
          maxZoom={map.maxZoom}
          showZoomLevel={map.showZoomLevel}
          onStepZoom={stepZoom}
          onRecenter={map.onRecenter}
          attributionWords={attributionWords}
          attribution={map.attribution}
          overlay={map.overlay}
          words={map.words}
        >
          {map.children}
        </MapContent>
      )}

      <MapStateLayer
        state={state}
        emptyTitle={map.emptyTitle}
        emptyMessage={map.emptyMessage}
        unavailableTitle={map.unavailableTitle}
        unavailableMessage={map.unavailableMessage}
        errorTitle={map.errorTitle}
        errorMessage={map.errorMessage}
        words={map.words}
        onRetry={onRetry}
        focusAfter={rootRef}
      />
    </View>
  );
}
