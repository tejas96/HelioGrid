'use client';
import type { GroundBox } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import { type PerspectiveCamera, Vector3 } from 'three';
import { fieldOfView } from '../components/camera-limits';
import { eased } from '../components/StudioRoofMotion';

/** Room kept between the roofs and a panel's top edge, in CSS pixels, before the view must move. */
const CLEAR_PX = 16;

/** Whether every corner of the held ground lands in the free room on the screen. */
function roofsClear(
  camera: PerspectiveCamera,
  ground: GroundBox,
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
): boolean {
  camera.updateMatrixWorld();
  const corner = new Vector3();
  for (const east of [ground.west, ground.east]) {
    for (const north of [ground.south, ground.north]) {
      corner.set(east, 0, -north).project(camera);
      const y = ((1 - corner.y) / 2) * size.height;
      if (y < free.top + CLEAR_PX || y > size.height - free.bottom - CLEAR_PX) return false;
    }
  }
  return true;
}

/**
 * The view's middle in the free room between the bars (a platform adapter). The map moves only when
 * it must: while a roof is drawn, or Roofs or the picker is open, the bars changing leave the view
 * where it is while what is drawn stays clear of them — a corner tapped stays under the finger —
 * and the view comes back to the middle once that ends. Otherwise
 * the middle glides over the emphasised duration as the panel slides, never a jump of the whole
 * picture. Under reduced motion, and on the first measure, it is there at once.
 */
export function useGlidingMiddle(
  camera: PerspectiveCamera,
  size: { readonly width: number; readonly height: number },
  free: { readonly top: number; readonly bottom: number },
  how: {
    readonly still: boolean;
    /** The view held still as the bars change, while its ground stays clear of them; `null` settles it. */
    readonly held: { readonly clear: GroundBox | null } | null;
    /** The view on show: a new one is laid again, never kept. */
    readonly view: string;
    /** The camera is still flying to a pose: what it shows now is not where it lands. */
    readonly flying: () => boolean;
  },
  invalidate: () => void,
): void {
  const middle = useRef<number | null>(null);
  // What the middle was last laid for: kept only while the screen and the view stay the same.
  const laidFor = useRef('');
  const { width, height } = size;
  const { still, held, view, flying } = how;
  const holding = held !== null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: the room and the hold are what move the middle; the held ground is read as it stands
  useEffect(() => {
    camera.fov = fieldOfView();
    const now = `${width}x${height}:${view}`;
    const same = laidFor.current === now;
    laidFor.current = now;
    const lay = (shift: number) => {
      middle.current = shift;
      camera.setViewOffset(width, height, 0, shift, width, height);
      camera.updateProjectionMatrix();
      invalidate();
    };
    const to = (free.bottom - free.top) / 2;
    const from = middle.current;
    if (
      from !== null &&
      same &&
      held !== null &&
      !flying() &&
      (held.clear === null || roofsClear(camera, held.clear, size, free))
    ) {
      invalidate();
      return;
    }
    if (from === null || still || from === to) {
      lay(to);
      return;
    }
    const start = performance.now();
    const ms = theme.motion.durations.emphasised;
    let frame = 0;
    const step = (now: number) => {
      const s = eased((now - start) / ms);
      lay(from + (to - from) * s);
      if (s < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [free.top, free.bottom, width, height, camera, invalidate, still, holding, view]);
}
