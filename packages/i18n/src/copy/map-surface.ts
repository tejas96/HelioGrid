/**
 * The map surface's own words (`packages/ui`'s `MapSurfaceWords`): its states, its 44px controls,
 * the placement pill and the pin's two states, a marker's live or last-seen name, and the imagery
 * line beside the attribution (`M05-16`) — authored once for both platforms, in three languages
 * (`F3-07`).
 */
import type { Translator } from '../runtime';
import { CHARTS } from './charts';
import { SIGN_IN } from './sign-in';

export const MAP_SURFACE = {
  loading: /*i18n*/ { id: 'Loading map' },
  emptyTitle: /*i18n*/ { id: 'No sites to show' },
  emptyMessage: /*i18n*/ { id: 'Assign a job to a technician and their route appears here.' },
  unavailableTitle: /*i18n*/ { id: 'No map imagery for this area' },
  unavailableMessage: /*i18n*/ {
    id: 'This location has no tiles from our provider. The address and the recorded coordinates are still exact.',
  },
  errorTitle: /*i18n*/ { id: "Couldn't load the map" },
  zoomIn: /*i18n*/ { id: 'Zoom in' },
  zoomOut: /*i18n*/ { id: 'Zoom out' },
  zoomInFrom: /*i18n*/ { id: 'Zoom in — level {level}' },
  zoomOutFrom: /*i18n*/ { id: 'Zoom out — level {level}' },
  zoomLevel: /*i18n*/ { id: 'Zoom {level}' },
  recentre: /*i18n*/ { id: 'Recentre — keeps this zoom' },
  placePin: /*i18n*/ {
    id: 'Place the pin — tap the map, or press Enter to place it at the centre',
  },
  dragMap: /*i18n*/ { id: 'Drag map to adjust' },
  tapToPlace: /*i18n*/ { id: 'Tap to place, or drag the map' },
  pinPending: /*i18n*/ { id: 'Pin pending' },
  pinConfirmed: /*i18n*/ { id: 'Location confirmed' },
  draggable: /*i18n*/ { id: '{pin}, draggable' },
  position: /*i18n*/ { id: 'Position' },
  live: /*i18n*/ { id: '{name}, live' },
  lastSeenName: /*i18n*/ { id: '{name}, last seen {time}' },
  lastSeen: /*i18n*/ { id: 'last seen {time}' },
  imageryOn: /*i18n*/ { id: 'Imagery {date}' },
  pinnedAtCapture: /*i18n*/ { id: 'pinned at capture' },
} as const;

/** Every word `MapSurface` draws or speaks of its own, in the reader's language. */
export function mapSurfaceWords(t: Translator['t']) {
  return {
    loading: t(MAP_SURFACE.loading),
    emptyTitle: t(MAP_SURFACE.emptyTitle),
    emptyMessage: t(MAP_SURFACE.emptyMessage),
    unavailableTitle: t(MAP_SURFACE.unavailableTitle),
    unavailableMessage: t(MAP_SURFACE.unavailableMessage),
    errorTitle: t(MAP_SURFACE.errorTitle),
    errorMessage: t(CHARTS.errorMessage),
    retry: t(SIGN_IN.tryAgain),
    zoomIn: t(MAP_SURFACE.zoomIn),
    zoomOut: t(MAP_SURFACE.zoomOut),
    zoomInFrom: (level: number) => t(MAP_SURFACE.zoomInFrom, { level }),
    zoomOutFrom: (level: number) => t(MAP_SURFACE.zoomOutFrom, { level }),
    zoomLevel: (level: number) => t(MAP_SURFACE.zoomLevel, { level }),
    recentre: t(MAP_SURFACE.recentre),
    placePin: t(MAP_SURFACE.placePin),
    dragMap: t(MAP_SURFACE.dragMap),
    tapToPlace: t(MAP_SURFACE.tapToPlace),
    pinPending: t(MAP_SURFACE.pinPending),
    pinConfirmed: t(MAP_SURFACE.pinConfirmed),
    draggable: (pin: string) => t(MAP_SURFACE.draggable, { pin }),
    position: t(MAP_SURFACE.position),
    live: (name: string) => t(MAP_SURFACE.live, { name }),
    lastSeenName: (name: string, time: string) => t(MAP_SURFACE.lastSeenName, { name, time }),
    lastSeen: (time: string) => t(MAP_SURFACE.lastSeen, { time }),
    imageryOn: (date: string) => t(MAP_SURFACE.imageryOn, { date }),
    pinnedAtCapture: t(MAP_SURFACE.pinnedAtCapture),
  };
}
