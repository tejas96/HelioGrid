import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { MapControls } from './MapControls.native';
import { MapLocationPin } from './MapLocationPin.native';
import { MapMarkerDot } from './MapMarkerDot.native';
import { MapAttribution, MapPlaceLayer } from './MapPlaceLayer.native';
import type {
  MapAccuracy,
  MapGeofence,
  MapMarker,
  MapPin,
  MapRoutePoint,
} from './MapSurface.types';
import { MapVectors } from './MapVectors.native';
import type { ResolvedPlacement } from './map-placement';

export interface MapContentProps {
  /** The real map. Omitted, a neutral stand-in is drawn. */
  children?: ReactNode;
  markers: MapMarker[];
  route: MapRoutePoint[] | null;
  geofences: MapGeofence[];
  accuracy: MapAccuracy | null;
  place: ResolvedPlacement;
  pin: MapPin | null;
  pinState: 'pending' | 'confirmed' | null;
  onTap?: (event: GestureResponderEvent) => void;
  onPinDrag: (pageX: number, pageY: number) => void;
  canDragPin: boolean;
  controls: boolean;
  zoom?: number;
  minZoom: number;
  maxZoom: number;
  showZoomLevel: boolean;
  onStepZoom: (delta: number) => void;
  onRecenter?: (info: { zoom?: number }) => void;
  attributionWords: string | null;
  attribution?: ReactNode;
  overlay?: ReactNode;
}

const styles = StyleSheet.create({
  grid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors['surface-alt'],
  },
  pill: {
    position: 'absolute',
    bottom: theme.spacing['sp-3'],
    alignSelf: 'center',
    zIndex: 2,
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    ...theme.elevation.e3,
  },
  pillWithOverlay: { bottom: 74 },
  pillText: { fontWeight: '500' },
  overlay: {
    position: 'absolute',
    right: theme.spacing['sp-3'],
    bottom: theme.spacing['sp-3'],
    left: theme.spacing['sp-3'],
    zIndex: 3,
  },
});

/**
 * Everything the surface draws when it is not blocked, in stacking order: tiles, vectors,
 * markers, the placement layer (z 1), the pin and pill (z 2), the controls, and the overlay
 * (z 3) — which is above the placement layer because it carries the button that consumes the
 * pending pin.
 */
export function MapContent(props: MapContentProps) {
  const { place, pin, pinState, overlay } = props;
  const hasOverlay = overlay !== null && overlay !== undefined;
  return (
    <>
      {props.children ?? <View style={styles.grid} />}
      <MapVectors geofences={props.geofences} accuracy={props.accuracy} route={props.route} />
      {props.markers.map((marker, index) => (
        <MapMarkerDot key={String(marker.id ?? `${marker.x}-${marker.y}-${index}`)} {...marker} />
      ))}

      {place.tapToPlace && props.onTap !== undefined ? <MapPlaceLayer onTap={props.onTap} /> : null}

      {pin === null || pinState === null ? null : (
        <MapLocationPin
          pin={pin}
          pinState={pinState}
          fixed={place.fixedPin && pin.placed !== true}
          draggable={place.dragPin && props.canDragPin}
          onDragTo={props.onPinDrag}
        />
      )}

      {/* The pill is the pointer reading and stays on touch too — nothing is taken away. */}
      {place.pill === null ? null : (
        <View style={[styles.pill, hasOverlay ? styles.pillWithOverlay : undefined]}>
          <Text variant="body-sm" style={styles.pillText}>
            {place.pill}
          </Text>
        </View>
      )}

      {props.controls ? (
        <MapControls
          zoom={props.zoom}
          minZoom={props.minZoom}
          maxZoom={props.maxZoom}
          showZoomLevel={props.showZoomLevel}
          onStepZoom={props.onStepZoom}
          onRecenter={props.onRecenter}
        />
      ) : null}

      <MapAttribution
        words={props.attributionWords}
        node={props.attribution}
        hasOverlay={hasOverlay}
      />

      {hasOverlay ? <View style={styles.overlay}>{overlay}</View> : null}
    </>
  );
}
