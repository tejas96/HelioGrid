import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { MapContent } from './MapContent';
import { MapStateLayer } from './MapStates';
import type { MapPlaceEvent, MapSurfaceProps } from './MapSurface.types';
import {
  imageryWords,
  isBlockedState,
  normalisePlacement,
  resolvePinState,
  toPercent,
} from './map-placement';
import { useCoarsePointer } from './use-coarse-pointer';
import { useMapZoom } from './use-map-zoom';

interface WebMapSurfaceProps extends MapSurfaceProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Map frame for field workforce — routes, day playback, geofences, **address confirmation**.
 * Owns the frame, overlays, 44px controls, the placement interaction and the states; the tiles
 * come from your map library, passed as `children`.
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
  className,
  style,
}: WebMapSurfaceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const coarse = useCoarsePointer();
  const place = normalisePlacement(placement, {
    coarse,
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

  const pctFromEvent = (event: { clientX: number; clientY: number }) => {
    const el = rootRef.current;
    if (el === null) {
      return null;
    }
    const rect = el.getBoundingClientRect();
    return {
      x: toPercent(event.clientX - rect.left, rect.width),
      y: toPercent(event.clientY - rect.top, rect.height),
    };
  };
  const emit = (
    event: { clientX: number; clientY: number },
    source: MapPlaceEvent['source'],
    to: ((e: MapPlaceEvent) => void) | undefined,
  ) => {
    const point = pctFromEvent(event);
    if (point !== null && to !== undefined) {
      to({ ...point, source });
    }
  };

  const attributionWords = imagery === null ? null : imageryWords(imagery);

  return (
    <div
      ref={rootRef}
      className={classNames('hg-map-surface', className)}
      style={{ height, ...(radius === undefined ? {} : { borderRadius: radius }), ...style }}
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
          onTap={onPlace === undefined ? undefined : (e) => emit(e, 'tap', onPlace)}
          onKeyboardPlace={() => onPlace?.({ x: 50, y: 50, source: 'tap' })}
          onPinDrag={(e: ReactPointerEvent<HTMLElement>) => emit(e, 'pin-drag', onPinMove)}
          canDragPin={onPinMove !== undefined}
          controls={controls}
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          showZoomLevel={showZoomLevel}
          onStepZoom={stepZoom}
          onRecenter={onRecenter}
          attributionWords={attributionWords}
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
    </div>
  );
}
