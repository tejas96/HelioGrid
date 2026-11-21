'use client';
import type { GroundPoint } from '@heliogrid/domain';
import { type MouseEvent, type PointerEvent, type RefObject, useRef } from 'react';
import type { StudioDrive } from '../components/StudioCameraRig';
import type { RoofRise } from '../components/StudioRoofs';

/** A press that moves less than this, in CSS pixels, is a tap; more is a drag. */
const TAP_PX = 6;

export interface PressActs {
  /** Told where on the ground the drag took hold. */
  onDragStart?: (at: GroundPoint | null) => void;
  onDrag?: (at: GroundPoint) => void;
  onDragEnd?: () => void;
  /** A press that never moved: the mark's tap. */
  onTap?: () => void;
  /** The drag starts the moment the pointer goes down: the + and the handles. */
  dragAtOnce?: boolean;
}

/**
 * The web's press on a roof mark (a platform adapter), set on the mark's holder round its
 * `Pressable`: it keeps the pointer while it is held, tells a drag from a tap, and hands the drag
 * the ground under it at the height the roofs stand. A key's press is the `Pressable`'s own.
 */
export function useRoofPress(drive: RefObject<StudioDrive | null>, rise: RoofRise) {
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const handled = useRef(false);
  const groundOf = (event: PointerEvent<HTMLElement>) =>
    drive.current?.groundAt(event.clientX, event.clientY, rise.current) ?? null;
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
        acts.onDragStart?.(groundOf(event));
      }
      const at = held.dragging ? groundOf(event) : null;
      if (at !== null) acts.onDrag?.(at);
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const held = press.current;
      press.current = null;
      if (held === null) return;
      event.stopPropagation();
      handled.current = true;
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
      if (held?.dragging) acts.onDragEnd?.();
    },
  });
}
