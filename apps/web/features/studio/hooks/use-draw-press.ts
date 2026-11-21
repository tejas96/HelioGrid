'use client';
import { type StudioScreen, useAimHold } from '@heliogrid/data/react';
import type { GroundPoint } from '@heliogrid/domain';
import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react';
import type { StudioDrive } from '../components/StudioCameraRig';

/** A press that moves less than this, in CSS pixels, is a tap; more moves the map. */
const TAP_PX = 6;

/**
 * The web's press on the map (a platform adapter, `T-M05-002` part b): a tap places a corner while
 * drawing, or lets a picked corner go; a drag is the camera's. On a phone a finger held still
 * while drawing aims, with the loupe, and places on lift; a mouse shows the spot as it moves. Esc
 * puts back what is in hand.
 */
export function useDrawPress(studio: StudioScreen, drive: RefObject<StudioDrive | null>) {
  const { moves, roofStep } = studio;
  const drawing = roofStep.kind === 'drawing';
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const hold = useAimHold();
  // biome-ignore lint/plugin: where the aiming finger is on the page, which the loupe follows
  const [aim, setAim] = useState<{ x: number; y: number } | null>(null);
  const groundAt = (x: number, y: number): GroundPoint | null =>
    drive.current?.groundAt(x, y, 0) ?? null;
  const stopAiming = () => {
    hold.stop();
    drive.current?.hold(false);
    setAim(null);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    press.current = { x: event.clientX, y: event.clientY, moved: false };
    if (!drawing || event.pointerType === 'mouse') return;
    const { clientX: x, clientY: y } = event;
    hold.start(() => {
      if (press.current?.moved !== false) return;
      drive.current?.hold(true);
      setAim({ x, y });
      moves.hover(groundAt(x, y));
    });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;
    if (held !== null && Math.hypot(event.clientX - held.x, event.clientY - held.y) > TAP_PX) {
      held.moved = true;
      if (aim === null) hold.stop();
    }
    if (!drawing) return;
    if (aim !== null) setAim({ x: event.clientX, y: event.clientY });
    const hovering = aim !== null || (event.pointerType === 'mouse' && event.buttons === 0);
    if (hovering) moves.hover(groundAt(event.clientX, event.clientY));
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const held = press.current;
    press.current = null;
    const aimed = aim !== null;
    stopAiming();
    if (studio.objectsNote) moves.objectsSeen();
    if (held === null || (held.moved && !aimed)) return;
    const at = groundAt(event.clientX, event.clientY);
    if (at !== null) moves.tap(at);
  };
  // Esc puts back what is in hand: the draft, the length in the box, a drag, a picked corner.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (roofStep.kind !== 'idle') moves.cancel();
      else if (roofStep.picked !== null) moves.pickCorner(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roofStep, moves]);
  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (drawing && event.pointerType === 'mouse') moves.hover(null);
  };
  return {
    aim,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: stopAiming,
      onPointerLeave,
    },
  };
}
