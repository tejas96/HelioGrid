import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import { resolveMapSurfaceProps } from './MapSurface.logic';
import type { MapSurfaceProps } from './MapSurface.types';
import { imageryWords, isBlockedState, normalisePlacement, resolvePinState } from './map-placement';
import { useMapZoom } from './use-map-zoom';

/**
 * **What the surface decides before it draws**, held once for both halves: the props with their
 * defaults, the read's state and retry, whether content may draw, the placement reading, the
 * pin's state, the zoom step and the imagery line. Only the pointer differs by platform —
 * `coarse` is always true on React Native.
 */
export function useMapView(props: MapSurfaceProps, coarse: boolean) {
  const map = resolveMapSurfaceProps(props);
  const state = surfaceStateOf(map.read);
  const stepZoom = useMapZoom({
    zoom: map.zoom,
    minZoom: map.minZoom,
    maxZoom: map.maxZoom,
    firstPinZoom: map.firstPinZoom,
    hasPin: map.pin !== null,
    onZoomChange: map.onZoomChange,
    onZoomIn: map.onZoomIn,
    onZoomOut: map.onZoomOut,
  });
  return {
    map,
    state,
    onRetry: retryOf(map.read),
    blocked: isBlockedState(state),
    place: normalisePlacement(
      map.placement,
      { coarse, canPlace: map.onPlace !== undefined, canDragPin: map.onPinMove !== undefined },
      map.words,
    ),
    pinState: resolvePinState(map.pin),
    stepZoom,
    attributionWords: map.imagery === null ? null : imageryWords(map.imagery, map.words),
  };
}
