import type {
  MapGeofence,
  MapNoteProps,
  MapRoutePoint,
  MapStateLayerProps,
  MapSurfaceProps,
  MapSurfaceWords,
  ZoomStep,
} from './MapSurface.types';

/** The props every default has been applied to — the surface draws only from these. */
export type ResolvedMapSurfaceProps = MapSurfaceProps &
  Required<
    Pick<
      MapSurfaceProps,
      | 'height'
      | 'markers'
      | 'geofences'
      | 'emptyTitle'
      | 'emptyMessage'
      | 'unavailableTitle'
      | 'unavailableMessage'
      | 'errorTitle'
      | 'errorMessage'
      | 'controls'
      | 'minZoom'
      | 'maxZoom'
      | 'firstPinZoom'
      | 'showZoomLevel'
    >
  > & {
    route: MapRoutePoint[] | null;
    accuracy: NonNullable<MapSurfaceProps['accuracy']> | null;
    pin: NonNullable<MapSurfaceProps['pin']> | null;
    placement: NonNullable<MapSurfaceProps['placement']> | null;
    imagery: NonNullable<MapSurfaceProps['imagery']> | null;
  };

/** The six state words: the caller's for one state, else the surface's own. */
function stateWordsOf(props: MapSurfaceProps) {
  const { words } = props;
  return {
    emptyTitle: props.emptyTitle ?? words.emptyTitle,
    emptyMessage: props.emptyMessage ?? words.emptyMessage,
    unavailableTitle: props.unavailableTitle ?? words.unavailableTitle,
    unavailableMessage: props.unavailableMessage ?? words.unavailableMessage,
    errorTitle: props.errorTitle ?? words.errorTitle,
    errorMessage: props.errorMessage ?? words.errorMessage,
  };
}

/**
 * **Every default the surface has, stated once.** The six state words fall back to the surface's
 * own `words`; a level range and *zoom 20 on first pin* (`MS1-15`) hold unless the caller says.
 */
export function resolveMapSurfaceProps(props: MapSurfaceProps): ResolvedMapSurfaceProps {
  return {
    ...props,
    ...stateWordsOf(props),
    height: props.height ?? 320,
    markers: props.markers ?? [],
    route: props.route ?? null,
    geofences: props.geofences ?? [],
    accuracy: props.accuracy ?? null,
    controls: props.controls ?? true,
    pin: props.pin ?? null,
    placement: props.placement ?? null,
    minZoom: props.minZoom ?? 1,
    maxZoom: props.maxZoom ?? 22,
    firstPinZoom: props.firstPinZoom ?? 20,
    showZoomLevel: props.showZoomLevel ?? true,
    imagery: props.imagery ?? null,
    overlay: props.overlay ?? null,
  };
}

/**
 * The note that replaces the tiles, or `null`. A failed tile fetch is `error` and offers a retry;
 * nothing to show yet is `empty` and does not.
 */
export function mapNoteOf(props: MapStateLayerProps): MapNoteProps | null {
  if (props.state === 'error') {
    return {
      kind: 'error',
      title: props.errorTitle,
      message: props.errorMessage,
      onRetry: props.onRetry,
      retry: { label: props.words.retry, focusAfter: props.focusAfter },
    };
  }
  if (props.state === 'empty') {
    return { kind: 'empty', title: props.emptyTitle, message: props.emptyMessage };
  }
  return null;
}

/**
 * The two zoom controls: each names the level it steps from when there is one, and stops at its
 * end of the range.
 */
export function zoomStepsOf(
  zoom: number | undefined,
  minZoom: number,
  maxZoom: number,
  words: Pick<MapSurfaceWords, 'zoomIn' | 'zoomOut' | 'zoomInFrom' | 'zoomOutFrom'>,
): [ZoomStep, ZoomStep] {
  return [
    {
      delta: 1,
      label: zoom === undefined ? words.zoomIn : words.zoomInFrom(zoom),
      disabled: zoom !== undefined && zoom >= maxZoom,
      glyph: 'plus',
    },
    {
      delta: -1,
      label: zoom === undefined ? words.zoomOut : words.zoomOutFrom(zoom),
      disabled: zoom !== undefined && zoom <= minZoom,
      glyph: 'minus',
    },
  ];
}

export function fenceKeyOf(fence: MapGeofence): string {
  return String(fence.id ?? `${fence.x}-${fence.y}-${fence.r}`);
}

/** The day route as polyline points — none until it has two points to join. */
export function routePointsOf(route: MapRoutePoint[] | null): string | null {
  if (route === null || route.length <= 1) return null;
  return route.map((p) => `${p.x},${p.y}`).join(' ');
}
