import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { MapContent } from './MapContent';
import { MapStateLayer } from './MapStates';
import type { MapPlaceEvent, MapSurfaceProps } from './MapSurface.types';
import { toPercent } from './map-placement';
import { useCoarsePointer } from './use-coarse-pointer';
import { useMapView } from './use-map-view';

interface WebMapSurfaceProps extends MapSurfaceProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Map frame for field workforce — routes, day playback, geofences, **address confirmation**.
 * Owns the frame, overlays, 44px controls, the placement interaction and the states; the tiles
 * come from your map library, passed as `children`.
 */
export function MapSurface(props: WebMapSurfaceProps) {
  const { className, style } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const coarse = useCoarsePointer();
  const { map, state, onRetry, blocked, place, pinState, stepZoom, attributionWords } = useMapView(
    props,
    coarse,
  );

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

  return (
    /* The root stays while a retried read reloads, so focus lands on it once *Try again* leaves. */
    <div
      ref={rootRef}
      tabIndex={-1}
      className={classNames('hg-map-surface', 'hg-focus-target', className)}
      style={{
        height: map.height,
        ...(map.radius === undefined ? {} : { borderRadius: map.radius }),
        ...style,
      }}
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
          onTap={map.onPlace === undefined ? undefined : (e) => emit(e, 'tap', map.onPlace)}
          onKeyboardPlace={() => map.onPlace?.({ x: 50, y: 50, source: 'tap' })}
          onPinDrag={(e: ReactPointerEvent<HTMLElement>) => emit(e, 'pin-drag', map.onPinMove)}
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
    </div>
  );
}
