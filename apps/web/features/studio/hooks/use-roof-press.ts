'use client';
import type { PointerScale } from '@heliogrid/data/react';
import type { GroundPoint } from '@heliogrid/domain';
import { type MouseEvent, type PointerEvent, type RefObject, useRef } from 'react';
import type { StudioDrive } from '../components/StudioCameraRig';
import { pointerScaleAt } from '../snap-reach';

/** A press that moves less than this, in CSS pixels, is a tap; more is a drag. */
const TAP_PX = 6;

export interface PressActs {
  /** Told where on the ground the drag took hold: where the pointer went down, however fast it left. */
  onDragStart?: (at: GroundPoint | null) => void;
  /** `scale`: what the pointer sees of the ground there, for the magnet's reach (`pointerScaleAt`). */
  onDrag?: (at: GroundPoint, scale?: PointerScale) => void;
  onDragEnd?: () => void;
  /** The system took the press away mid-drag (a pinch, an edge swipe): what was in hand goes back. */
  onDragCancel?: () => void;
  /** A press that never moved: the mark's tap. */
  onTap?: () => void;
  /** The drag starts the moment the pointer goes down: the move and turn handles. */
  dragAtOnce?: boolean;
}

/**
 * The web's press on a roof mark (a platform adapter), set on the mark's holder round its
 * `Pressable`: it keeps the pointer while it is held, tells a drag from a tap, and hands the drag
 * the ground under it. The marks are the top view's alone, so the ground is the picture's. A key's
 * press is the `Pressable`'s own.
 */
export function useRoofPress(
  drive: RefObject<StudioDrive | null>,
  /** A finger's drag shows the loupe where the finger is; `null` when it lifts. */
  onAim: (at: { x: number; y: number } | null) => void,
) {
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const handled = useRef(false);
  const groundAt = (x: number, y: number) => drive.current?.groundAt(x, y, 0) ?? null;
  const groundOf = (event: PointerEvent<HTMLElement>) => groundAt(event.clientX, event.clientY);
  const dragged = (event: PointerEvent<HTMLElement>, acts: PressActs) => {
    const at = groundOf(event);
    const touch = event.pointerType !== 'mouse';
    if (at !== null)
      acts.onDrag?.(at, pointerScaleAt(drive.current, event.clientX, event.clientY, touch));
    if (event.pointerType !== 'mouse') onAim({ x: event.clientX, y: event.clientY });
  };
  return (acts: PressActs) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      handled.current = false;
      // The holder keeps the pointer, so a quick drag never leaves the small mark behind.
      event.currentTarget.setPointerCapture(event.pointerId);
      press.current = { x: event.clientX, y: event.clientY, dragging: acts.dragAtOnce === true };
      if (acts.dragAtOnce) acts.onDragStart?.(groundOf(event));
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const held = press.current;
      if (held === null) return;
      if (!held.dragging && Math.hypot(event.clientX - held.x, event.clientY - held.y) > TAP_PX) {
        held.dragging = true;
        // Where the press went down, not where a fast drag has got to: that picks the corner.
        acts.onDragStart?.(groundAt(held.x, held.y));
      }
      if (held.dragging) dragged(event, acts);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const held = press.current;
      press.current = null;
      if (held === null) return;
      event.stopPropagation();
      handled.current = true;
      onAim(null);
      if (held.dragging) acts.onDragEnd?.();
      else acts.onTap?.();
    },
    // The click that ends a pointer press is done already; a key's click is the button's own.
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (!handled.current) return;
      handled.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
    onPointerCancel: () => {
      const held = press.current;
      press.current = null;
      onAim(null);
      if (held?.dragging) acts.onDragCancel?.();
    },
  });
}
