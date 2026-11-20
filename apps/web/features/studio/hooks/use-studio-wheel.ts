'use client';
import CameraControlsImpl from 'camera-controls';
import { type RefObject, useEffect } from 'react';

const { ACTION } = CameraControlsImpl;

/** Wheel events closer together than this belong to one gesture, which keeps its first reading. */
const GESTURE_GAP_MS = 200;
/** A mouse wheel's click on Windows and Linux: whole steps of this much or more. */
const WHEEL_CLICK_MIN = 50;
/** A mouse wheel's click in Safari and Chrome on a Mac: a whole multiple of this. */
const MAC_WHEEL_CLICK = 4.000_244_140_625;

type Reading = 'pan' | 'zoom';

/**
 * What a wheel event is. A mouse wheel turns in whole clicks, straight up and down; a trackpad's two
 * fingers send small steps, often sideways.
 */
function readingOf(event: WheelEvent): Reading {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return 'zoom';
  if (event.deltaX !== 0) return 'pan';
  const step = Math.abs(event.deltaY);
  if (Number.isInteger(step) && step >= WHEEL_CLICK_MIN) return 'zoom';
  if (step > 0 && step % MAC_WHEEL_CLICK === 0) return 'zoom';
  return 'pan';
}

/**
 * The wheel on the map, as a map works: a mouse wheel zooms; a trackpad's two-finger swipe moves the
 * map every way; a pinch (which a browser sends as a wheel with Ctrl held) zooms at the fingers.
 * The camera library would turn a pinch into a lens zoom that its distance limits never see — so a
 * pinch is handed back to it as a plain zoom, which keeps the map inside its edges and its
 * sharpness. A wheel over the map never scrolls or zooms the page.
 */
export function useStudioWheel(
  rig: RefObject<CameraControlsImpl | null>,
  map: HTMLElement | null,
): void {
  useEffect(() => {
    const host = map?.parentElement;
    if (map === null || host == null) return;
    const ours = new WeakSet<Event>();
    let gesture: { reading: Reading; at: number } | null = null;
    /** A pinch, handed back as a plain zoom at the same spot. */
    const zoomFor = (pinch: WheelEvent) => {
      pinch.preventDefault();
      pinch.stopPropagation();
      const zoom = new WheelEvent('wheel', {
        deltaY: pinch.deltaY,
        deltaMode: WheelEvent.DOM_DELTA_PIXEL,
        clientX: pinch.clientX,
        clientY: pinch.clientY,
        bubbles: true,
        cancelable: true,
      });
      ours.add(zoom);
      map.dispatchEvent(zoom);
    };
    /** One gesture keeps its first reading, so a swipe's slowing tail never turns into a zoom. */
    const readingFor = (event: WheelEvent): Reading => {
      const last = gesture;
      const reading =
        last !== null && event.timeStamp - last.at < GESTURE_GAP_MS
          ? last.reading
          : readingOf(event);
      gesture = { reading, at: event.timeStamp };
      return reading;
    };
    const heard = (event: WheelEvent) => {
      const controls = rig.current;
      if (controls === null) return;
      if (event.ctrlKey && !ours.has(event)) {
        zoomFor(event);
        return;
      }
      const reading = ours.has(event) ? 'zoom' : readingFor(event);
      controls.mouseButtons.wheel = reading === 'pan' ? ACTION.TRUCK : ACTION.DOLLY;
    };
    // On the map's holder, while the event comes down: before the camera library hears it.
    host.addEventListener('wheel', heard, { capture: true, passive: false });
    return () => host.removeEventListener('wheel', heard, { capture: true });
  }, [rig, map]);
}
