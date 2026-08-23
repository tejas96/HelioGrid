import { useEffect, useRef } from 'react';
import type { MapSurfaceProps } from './MapSurface.types';

/**
 * **Zoom is a level, not two nudges.** `zoom` in, `onZoomChange(level, {reason})` out, clamped to
 * min/max. `MS1-15`'s *zoom 20 on first pin* is announced through the same callback the moment a
 * first pin appears — never by a hidden reset — and re-centre never touches the level at all.
 *
 * Platform-neutral: this is React and arithmetic, so both halves share it rather than each
 * spelling the clamp themselves.
 */

interface MapZoomInput {
  zoom?: number;
  minZoom: number;
  maxZoom: number;
  firstPinZoom?: number;
  /** Whether a pin exists at all — the first transition to true is what MS1-15 hangs on. */
  hasPin: boolean;
  onZoomChange?: MapSurfaceProps['onZoomChange'];
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function useMapZoom(input: MapZoomInput): (delta: number) => void {
  const { zoom, minZoom, maxZoom, firstPinZoom, hasPin, onZoomChange, onZoomIn, onZoomOut } = input;
  const hadPin = useRef(hasPin);

  useEffect(() => {
    if (!hasPin) {
      hadPin.current = false;
      return;
    }
    if (hadPin.current) {
      return;
    }
    hadPin.current = true;
    if (
      onZoomChange !== undefined &&
      firstPinZoom !== undefined &&
      (zoom === undefined || zoom < firstPinZoom)
    ) {
      onZoomChange(Math.min(maxZoom, firstPinZoom), { reason: 'first-pin' });
    }
  }, [hasPin, onZoomChange, firstPinZoom, zoom, maxZoom]);

  return (delta: number) => {
    if (onZoomChange !== undefined && zoom !== undefined) {
      const next = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
      if (next !== zoom) {
        onZoomChange(next, { reason: delta > 0 ? 'zoom-in' : 'zoom-out' });
      }
      return;
    }
    /* No level supplied: the bare callbacks are the fallback, not the preferred channel. */
    if (delta > 0) {
      onZoomIn?.();
    } else {
      onZoomOut?.();
    }
  };
}
