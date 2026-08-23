import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { MapControls } from './MapControls';
import { MapLocationPin } from './MapLocationPin';
import { MapMarkerDot } from './MapMarkerDot';
import { MapAttribution, MapPlaceLayer } from './MapPlaceLayer';
import type {
  MapAccuracy,
  MapGeofence,
  MapMarker,
  MapPin,
  MapRoutePoint,
} from './MapSurface.types';
import { MapVectors } from './MapVectors';
import type { ResolvedPlacement } from './map-placement';

export interface MapContentProps {
  /** The real map. Omitted, a neutral grid stands in. */
  children?: ReactNode;
  markers: MapMarker[];
  route: MapRoutePoint[] | null;
  geofences: MapGeofence[];
  accuracy: MapAccuracy | null;
  place: ResolvedPlacement;
  pin: MapPin | null;
  pinState: 'pending' | 'confirmed' | null;
  onTap?: (event: ReactMouseEvent<HTMLElement>) => void;
  onKeyboardPlace: () => void;
  onPinDrag: (event: ReactPointerEvent<HTMLElement>) => void;
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
      {props.children ?? <div aria-hidden="true" className="hg-map-surface-grid" />}
      <MapVectors geofences={props.geofences} accuracy={props.accuracy} route={props.route} />
      {props.markers.map((marker, index) => (
        <MapMarkerDot key={String(marker.id ?? `${marker.x}-${marker.y}-${index}`)} {...marker} />
      ))}

      {place.tapToPlace && props.onTap !== undefined ? (
        <MapPlaceLayer onTap={props.onTap} onKeyboardPlace={props.onKeyboardPlace} />
      ) : null}

      {pin === null || pinState === null ? null : (
        <MapLocationPin
          pin={pin}
          pinState={pinState}
          fixed={place.fixedPin && pin.placed !== true}
          draggable={place.dragPin && props.canDragPin}
          onDrag={props.onPinDrag}
        />
      )}

      {/* The pill is the pointer reading and stays on touch too — nothing is taken away. */}
      {place.pill === null ? null : (
        <div className="hg-map-surface-pill" data-overlay={hasOverlay ? 'true' : undefined}>
          {place.pill}
        </div>
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

      {hasOverlay ? <div className="hg-map-surface-overlay">{overlay}</div> : null}
    </>
  );
}
