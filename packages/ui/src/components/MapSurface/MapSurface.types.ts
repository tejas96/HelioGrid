import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
/**
 * The system's one surface read, imported from the folder that owns it — exactly as
 * the design system's own MapSurface typings import it from `../feedback/UnavailableNote`, and as
 * sixteen sibling folders here already do. The split this component
 * depends on is the honest one: **`error`** means the tiles were there to fetch and the fetch
 * failed (warning tone, a retry, because trying again may work); **`unavailable`** means there is
 * no imagery for this area from this provider (neutral, and **no retry** — retrying cannot
 * conjure coverage). `tiles-unavailable` is gone; it was this component's private spelling of
 * the fourth state.
 */
import type { SurfaceRead, SurfaceState } from '../UnavailableNote';

/** Marker tones. A visual map keyed on this union is a `Record`, never a lookup with a default. */
export type MapMarkerTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface MapMarker {
  id?: string | number;
  /** Percent coordinates within the surface (0–100). */
  x: number;
  y: number;
  tone?: MapMarkerTone;
  /** Live positions pulse and are filled; last-known are hollow rings. Never the same. */
  live?: boolean;
  /** Shown on the chip and read out — "last seen 10:42 AM". */
  lastSeen?: string;
  // biome-ignore lint/plugin/copy-prop-type: the marker's name — a person's or a site's
  label?: string;
  onClick?: () => void;
}

/**
 * **The location pin — not a `MapMarker`.** `live` / `lastSeen` are field-workforce semantics
 * (live positions pulse and are filled; last-known are hollow rings), and a *pending* pin is not
 * a stale position — borrowing them would say something false. Two states, each carrying **a word**.
 */
export interface MapPin {
  /** Percent coordinates (0–100). Omitted with `placement`, the pin is the fixed centre crosshair. */
  x?: number;
  y?: number;
  /**
   * `pending` — a pin exists and nobody has agreed to it (`MS1-18`: Confirm Location is disabled
   * until a pin **pends**). Accent, hollow core, soft halo, the words "Pin pending".
   * `confirmed` — filled success pin, a tick, and "Location confirmed".
   */
  state?: 'pending' | 'confirmed';
  /** Replaces the state's words. Never removes them. */
  label?: TranslatedText;
  /** True once the pin has coordinates of its own — it stops riding the fixed centre. */
  placed?: boolean;
}

export interface MapPlacementSpec {
  /**
   * `auto` (default) — a coarse pointer **adds** tap-to-place and pin drag. `pointer`, `touch`, or
   * `both` to force. **No mode ever removes the fixed-pin reading**, because `MS1-16` is additive:
   * pointer *keeps* drag-map-under-fixed-pin, touch *adds* the other two.
   */
  input?: 'auto' | 'pointer' | 'touch' | 'both';
  /** The fixed centre pin. Default true. */
  fixedPin?: boolean;
  /** The pill's words — "Drag map to adjust". `null` renders none. */
  pill?: TranslatedText | null;
  /** Force tap-to-place on or off, overriding the input reading. */
  tapToPlace?: boolean;
  /** Force direct pin drag on or off. */
  dragPin?: boolean;
}

export interface MapPlaceEvent {
  x: number;
  y: number;
  source: 'tap' | 'pin-drag';
}

/** Percent-coordinate point on a day route. */
export interface MapRoutePoint {
  x: number;
  y: number;
}

/** A circular geofence in percent coordinates. */
export interface MapGeofence {
  id?: string | number;
  x: number;
  y: number;
  r: number;
  // biome-ignore lint/plugin/copy-prop-type: the fenced site's name
  label?: string;
}

/** The accuracy radius around a fix — draw it whenever the fix is coarse. */
export interface MapAccuracy {
  x: number;
  y: number;
  r: number;
}

/** `M05-16` — the imagery tile the design is traced on is pinned at capture. */
export interface MapImagerySpec {
  capturedAt?: string;
  source?: string;
  pinned?: boolean;
}

/**
 * The words the surface says of its own, from `packages/i18n`'s `mapSurfaceWords`: its states and
 * retry, its controls' names, the placement pill, the pin's two states, a marker's name and the
 * imagery line. The surface's own `emptyTitle` … `errorMessage` replace one state's words.
 */
export interface MapSurfaceWords {
  /** The loading region's name — "Loading map". */
  loading: TranslatedText;
  emptyTitle: TranslatedText;
  emptyMessage: TranslatedText;
  unavailableTitle: TranslatedText;
  unavailableMessage: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage: TranslatedText;
  /** The failed read's *Try again*. */
  retry: TranslatedText;
  /** The zoom controls' names with no level supplied, and with one. */
  zoomIn: TranslatedText;
  zoomOut: TranslatedText;
  zoomInFrom: (level: number) => TranslatedText;
  zoomOutFrom: (level: number) => TranslatedText;
  /** The level, legible on the surface — "Zoom 20". */
  zoomLevel: (level: number) => TranslatedText;
  recentre: TranslatedText;
  /** The tap-to-place layer's name, which also says the keyboard's way. */
  placePin: TranslatedText;
  /** The placement pill's words: the pointer reading, and the touch reading that adds tapping. */
  dragMap: TranslatedText;
  tapToPlace: TranslatedText;
  pinPending: TranslatedText;
  pinConfirmed: TranslatedText;
  /** A pin's name while a finger can drag it — "Pin pending, draggable". */
  draggable: (pin: string) => TranslatedText;
  /** A marker's name when it has none of its own. */
  position: TranslatedText;
  /** A marker's name with the live / last-known difference in it. */
  live: (name: string) => TranslatedText;
  lastSeenName: (name: string, time: string) => TranslatedText;
  /** The last-known chip's words — "last seen 10:42 AM". */
  lastSeen: (time: string) => TranslatedText;
  /** The imagery line's parts — "Imagery 12 Mar 2026 · pinned at capture". */
  imageryOn: (date: string) => TranslatedText;
  pinnedAtCapture: TranslatedText;
}

/** Every level change travels through one channel, and it says why. */
export type MapZoomReason = 'zoom-in' | 'zoom-out' | 'first-pin';

export interface MapSurfaceProps {
  /** The real map (Leaflet / MapLibre / Google). Omitted, a neutral grid stands in. */
  children?: ReactNode;
  height?: number;
  radius?: string | number;
  markers?: MapMarker[];
  /** Percent-coordinate path for a day route. */
  route?: MapRoutePoint[] | null;
  /** Circular geofences in percent coordinates. */
  geofences?: MapGeofence[];
  /** Accuracy radius around a fix — draw it whenever the fix is coarse. */
  accuracy?: MapAccuracy | null;
  /**
   * The system's one state vocabulary. Neither `error` nor `unavailable` ever leaves blank space.
   * Required: what this draws always comes from a read, and a failed read carries its retry.
   */
  read: SurfaceRead;
  /** Every word the surface says of its own; the six below replace one state's words. */
  words: MapSurfaceWords;
  emptyTitle?: TranslatedText;
  emptyMessage?: TranslatedText;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  controls?: boolean;
  /** Fallbacks, used only when `zoom` is not supplied. Prefer the level. */
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  /**
   * **Re-centre never changes zoom** (`MS1-15`: *user zoom preserved on re-centre*), so the current
   * level is handed back rather than left for the host to restore.
   */
  onRecenter?: (info: { zoom?: number }) => void;
  /** The location pin. Its own prop, with its own states — never a `marker`. */
  pin?: MapPin | null;
  /** Turns the surface into a placement surface. A string is shorthand for `{ }`. */
  placement?: MapPlacementSpec | 'fixed-pin' | null;
  /** A tap on the surface (touch) — `MS1-16`'s "pin jumps". */
  onPlace?: (e: MapPlaceEvent) => void;
  /** The pin dragged directly (touch). */
  onPinMove?: (e: MapPlaceEvent) => void;
  /** **The zoom level, in.** Supply it and the controls clamp, disable and read it out. */
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  /** **The zoom level, out** — the one channel every level change travels through. */
  onZoomChange?: (zoom: number, info: { reason: MapZoomReason }) => void;
  /** `MS1-15`'s *zoom 20 on first pin*, announced through `onZoomChange` when a first pin appears. */
  firstPinZoom?: number;
  showZoomLevel?: boolean;
  /**
   * `M05-16` — *"the imagery tile the design is traced on is **pinned at capture**"*. Rendered in
   * words beside the attribution, because a promise nobody can see kept is not one.
   */
  imagery?: MapImagerySpec | TranslatedText | null;
  /**
   * Node pinned to the bottom of the surface — an address card, a playback scrubber, `MS1-18`'s
   * Confirm Location. It sits **above** the placement layer: a placement layer stacked over it made
   * the one button that consumes the pending pin untappable on touch — the tap re-placed the pin
   * instead. Anything a finger must reach goes here, not under it.
   */
  overlay?: ReactNode;
  attribution?: ReactNode;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface MapNoteProps {
  kind: 'error' | 'empty';
  title: TranslatedText;
  message: TranslatedText;
  onRetry?: () => void;
  /** The retry's words and where focus lands once it leaves — an error's only. */
  retry?: { label: TranslatedText; focusAfter: FocusAfter };
}

export interface MapUnavailableProps {
  title: TranslatedText;
  message: TranslatedText;
}

export interface MapStateLayerProps {
  state: SurfaceState;
  emptyTitle: TranslatedText;
  emptyMessage: TranslatedText;
  unavailableTitle: TranslatedText;
  unavailableMessage: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage: TranslatedText;
  words: Pick<MapSurfaceWords, 'loading' | 'retry'>;
  onRetry?: () => void;
  /** The surface, which stays while the retried read reloads. */
  focusAfter: FocusAfter;
}

/** One zoom control: the level it steps by, and the control it is drawn as. */
export interface ZoomStep {
  delta: 1 | -1;
  label: TranslatedText;
  disabled: boolean;
  glyph: ShellGlyphName;
}

export interface MapControlsProps {
  zoom?: number;
  minZoom: number;
  maxZoom: number;
  showZoomLevel: boolean;
  onStepZoom: (delta: number) => void;
  onRecenter?: (info: { zoom?: number }) => void;
  words: MapSurfaceWords;
}
