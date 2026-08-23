import type { MapImagerySpec, MapPlacementSpec, MapSurfaceProps } from './MapSurface.types';

/**
 * `MS1-16`'s touch/pointer split is **additive**, not a preference: pointer keeps
 * drag-map-under-fixed-pin with the pill, touch **adds** tap-to-place and direct pin drag.
 * No mode ever removes the fixed-pin reading, so the rule lives in one function.
 */

export interface ResolvedPlacement {
  fixedPin: boolean;
  pill: string | null;
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

const PILL_POINTER = 'Drag map to adjust';
const PILL_TOUCH = 'Tap to place, or drag the map';

export function normalisePlacement(
  placement: MapSurfaceProps['placement'],
  input: PlacementInput,
): ResolvedPlacement {
  if (placement === null || placement === undefined) {
    return { fixedPin: false, pill: null, tapToPlace: false, dragPin: false };
  }
  const spec: MapPlacementSpec = typeof placement === 'string' ? {} : placement;
  const mode = spec.input ?? 'auto';
  const touch = mode === 'touch' || mode === 'both' || (mode === 'auto' && input.coarse);
  const defaultPill = touch ? PILL_TOUCH : PILL_POINTER;
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
export function imageryWords(imagery: MapImagerySpec | string): string {
  if (typeof imagery === 'string') {
    return imagery;
  }
  const parts: string[] = [];
  if (imagery.capturedAt !== undefined && imagery.capturedAt !== '') {
    parts.push(`Imagery ${imagery.capturedAt}`);
  }
  if (imagery.pinned !== false) {
    parts.push('pinned at capture');
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
export function isBlockedState(state: MapSurfaceProps['state']): boolean {
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

/** The accessible name for a marker: the live / last-known difference is in the name too. */
export function markerLabel(label: string | undefined, live: boolean, lastSeen?: string): string {
  const base = label ?? 'Position';
  if (live) {
    return `${base}, live`;
  }
  if (lastSeen !== undefined && lastSeen !== '') {
    return `${base}, last seen ${lastSeen}`;
  }
  return base;
}
