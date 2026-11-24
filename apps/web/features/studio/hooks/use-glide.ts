'use client';
import type { GroundPoint } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { type RefObject, useLayoutEffect, useRef } from 'react';
import { pointText } from '../components/roof-marks-place';
import { eased } from '../components/StudioRoofMotion';

/**
 * A mark on the plan that glides to where it goes (a platform adapter): its `data-at`, which the
 * placer reads each frame, moves there over the emphasised duration — the stairs moved from their
 * row, or by Undo. Held by a drag, or under reduced motion, it is there at once. Written to the
 * node, so no render runs per frame; the frames stop at the end, or when the mark goes.
 */
export function useGlide(
  node: RefObject<HTMLElement | null>,
  to: GroundPoint,
  how: {
    readonly glide: boolean;
    /** The mark is drawn: a mark drawn again takes its place at once. */
    readonly drawn: boolean;
    /** Lays the mark where its new place lands on the screen. */
    readonly moved: () => void;
  },
) {
  const { glide, drawn } = how;
  const moved = useRef(how.moved);
  moved.current = how.moved;
  const shown = useRef<GroundPoint | null>(null);
  // Keyed on the point's two numbers: a render that brings the same point leaves a glide running.
  const { east, north } = to;
  useLayoutEffect(() => {
    const at = { east, north };
    const mark = node.current;
    if (mark === null || !drawn) {
      shown.current = null;
      return;
    }
    const write = (point: GroundPoint) => {
      shown.current = point;
      mark.dataset.at = pointText(point);
      moved.current();
    };
    const from = shown.current;
    if (from === null || !glide || (from.east === at.east && from.north === at.north)) {
      write(at);
      return;
    }
    const start = performance.now();
    const ms = theme.motion.durations.emphasised;
    let frame = 0;
    const step = (now: number) => {
      const s = eased((now - start) / ms);
      write({
        east: from.east + (at.east - from.east) * s,
        north: from.north + (at.north - from.north) * s,
      });
      if (s < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [node, east, north, glide, drawn]);
}
