import type { TranslatedText } from '@heliogrid/contracts';
import type { SurfaceState } from '../UnavailableNote';
import type {
  MapImagerySpec,
  MapMarker,
  MapPin,
  MapPlacementSpec,
  MapSurfaceProps,
  MapSurfaceWords,
} from './MapSurface.types';

/**
 * `MS1-16`'s touch/pointer split is **additive**, not a preference: pointer keeps
 * drag-map-under-fixed-pin with the pill, touch **adds** tap-to-place and direct pin drag.
 * No mode ever removes the fixed-pin reading, so the rule lives in one function.
 */

export interface ResolvedPlacement {
  fixedPin: boolean;
  pill: TranslatedText | null;
  tapToPlace: boolean;
  dragPin: boolean;
}

interface PlacementInput {
  /** True where the pointer is coarse. Always true on React Native. */
  coarse: boolean;
  /** Whether the host supplied `onPlace` — a tap that goes nowhere is not an affordance. */
  canPlace: boolean;
  /** Whether the host supplied `onPinMove`. */
  canDragPin: boolean;
}

/** The pill's own words: the pointer reading, and the touch reading that adds tapping. */
type PillWords = Pick<MapSurfaceWords, 'dragMap' | 'tapToPlace'>;

export function normalisePlacement(
  placement: MapSurfaceProps['placement'],
  input: PlacementInput,
  words: PillWords,
): ResolvedPlacement {
  if (placement === null || placement === undefined) {
    return { fixedPin: false, pill: null, tapToPlace: false, dragPin: false };
  }
  const spec: MapPlacementSpec = typeof placement === 'string' ? {} : placement;
  const mode = spec.input ?? 'auto';
  const touch = mode === 'touch' || mode === 'both' || (mode === 'auto' && input.coarse);
  const defaultPill = touch ? words.tapToPlace : words.dragMap;
  return {
    fixedPin: spec.fixedPin !== false,
    pill: spec.pill === null ? null : (spec.pill ?? defaultPill),
    tapToPlace: spec.tapToPlace ?? (touch && input.canPlace),
    dragPin: spec.dragPin ?? (touch && input.canDragPin),
  };
}

/**
 * `M05-16` in words beside the attribution — *"Imagery 12 Mar 2026 · pinned at capture · Bhuvan"*.
 * A promise nobody can see kept is not one.
 */
export function imageryWords(
  imagery: MapImagerySpec | TranslatedText,
  words: Pick<MapSurfaceWords, 'imageryOn' | 'pinnedAtCapture'>,
): string {
  if (typeof imagery === 'string') {
    return imagery;
  }
  const parts: string[] = [];
  if (imagery.capturedAt !== undefined && imagery.capturedAt !== '') {
    parts.push(words.imageryOn(imagery.capturedAt));
  }
  if (imagery.pinned !== false) {
    parts.push(words.pinnedAtCapture);
  }
  if (imagery.source !== undefined && imagery.source !== '') {
    parts.push(imagery.source);
  }
  return parts.join(' · ');
}

/** Percent coordinates, clamped to the surface. */
export function toPercent(offset: number, extent: number): number {
  if (extent <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (offset / extent) * 100));
}

/** A state whose surface must not draw content. */
export function isBlockedState(state: SurfaceState): boolean {
  return state === 'loading' || state === 'empty' || state === 'error' || state === 'unavailable';
}

/**
 * A pin is either pending or confirmed — there is no third reading, and no pin at all is not a
 * state of the pin. `MS1-18` hangs Confirm Location on the difference.
 */
export function resolvePinState(pin: MapSurfaceProps['pin']): 'pending' | 'confirmed' | null {
  if (pin === null || pin === undefined) {
    return null;
  }
  return pin.state === 'confirmed' ? 'confirmed' : 'pending';
}

/** The words a marker's name is built from. */
export type MarkerWords = Pick<MapSurfaceWords, 'position' | 'live' | 'lastSeenName' | 'lastSeen'>;

/** The accessible name for a marker: the live / last-known difference is in the name too. */
export function markerLabel(
  label: string | undefined,
  live: boolean,
  lastSeen: string | undefined,
  words: MarkerWords,
): string {
  const base = label ?? words.position;
  if (live) {
    return words.live(base);
  }
  if (lastSeen !== undefined && lastSeen !== '') {
    return words.lastSeenName(base, lastSeen);
  }
  return base;
}

/** The chip under a marker: its label, and the last-seen time while it is stale — or none at all. */
export function markerChipOf(
  label: string | undefined,
  live: boolean,
  lastSeen: string | undefined,
  words: Pick<MapSurfaceWords, 'lastSeen'>,
): string | null {
  const stale = !live;
  if (label === undefined && !(stale && lastSeen !== undefined)) {
    return null;
  }
  return `${label ?? ''}${stale && lastSeen !== undefined ? ` · ${words.lastSeen(lastSeen)}` : ''}`;
}

export function markerKeyOf(marker: MapMarker, index: number): string {
  return String(marker.id ?? `${marker.x}-${marker.y}-${index}`);
}

/**
 * Where the pin stands and what it is called. It rides the fixed centre until it has coordinates
 * of its own, and its name is in words first — pending and confirmed never rest on the colour.
 */
export function pinReadingOf(
  pin: MapPin,
  pinState: 'pending' | 'confirmed',
  fixed: boolean,
  draggable: boolean,
  words: Pick<MapSurfaceWords, 'pinPending' | 'pinConfirmed' | 'draggable'>,
): { confirmed: boolean; name: TranslatedText; spokenName: TranslatedText; x: number; y: number } {
  const confirmed = pinState === 'confirmed';
  const name = pin.label ?? (confirmed ? words.pinConfirmed : words.pinPending);
  return {
    confirmed,
    name,
    spokenName: draggable ? words.draggable(name) : name,
    x: fixed ? 50 : (pin.x ?? 50),
    y: fixed ? 50 : (pin.y ?? 50),
  };
}
