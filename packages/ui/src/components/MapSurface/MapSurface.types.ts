import type { ReactNode } from 'react';
/**
 * The system's one surface-state vocabulary, imported from the folder that owns it — exactly as
 * the design system's own MapSurface typings import it from `../feedback/UnavailableNote`, and as
 * sixteen sibling folders here already do. The split this component
 * depends on is the honest one: **`error`** means the tiles were there to fetch and the fetch
 * failed (warning tone, a retry, because trying again may work); **`unavailable`** means there is
 * no imagery for this area from this provider (neutral, and **no retry** — retrying cannot
 * conjure coverage). `tiles-unavailable` is gone; it was this component's private spelling of
 * the fourth state.
 */
import type { SurfaceState } from '../UnavailableNote';

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
  label?: string;
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
  pill?: string | null;
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
  /** The system's one state vocabulary. Neither `error` nor `unavailable` ever leaves blank space. */
  state?: SurfaceState;
  emptyTitle?: string;
  emptyMessage?: string;
  unavailableTitle?: string;
  unavailableMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
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
  imagery?: MapImagerySpec | string | null;
  /**
   * Node pinned to the bottom of the surface — an address card, a playback scrubber, `MS1-18`'s
   * Confirm Location. It sits **above** the placement layer: a placement layer stacked over it made
   * the one button that consumes the pending pin untappable on touch — the tap re-placed the pin
   * instead. Anything a finger must reach goes here, not under it.
   */
  overlay?: ReactNode;
  attribution?: ReactNode;
}
