'use client';
import { type RefObject, useEffect, useRef, useState } from 'react';

/** The room the bars take at the top and the foot of the canvas, and a panel at its right, in CSS pixels. */
export interface ChromeRoom {
  readonly top: number;
  readonly bottom: number;
  readonly right: number;
}

const NONE: ChromeRoom = { top: 0, bottom: 0, right: 0 };

/**
 * The web's measure of the canvas's bars: how far the head reaches down, and how far the bottom
 * bar reaches up, so the camera frames the site in the room between them. It follows every resize.
 */
export function useChromeRoom(
  /** A part that swaps the bar for another (a roof's sheet): each new value measures again. */
  swapped: boolean,
): {
  readonly frame: RefObject<HTMLDivElement | null>;
  readonly top: RefObject<HTMLDivElement | null>;
  readonly bottom: RefObject<HTMLDivElement | null>;
  /** A panel at the right (a desktop's sheet): the model keeps the room left of it. */
  readonly side: RefObject<HTMLDivElement | null>;
  readonly room: ChromeRoom;
} {
  const frame = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLDivElement>(null);
  // biome-ignore lint/plugin: the web's own measure of laid-out boxes; the phone shows this page
  const [room, setRoom] = useState<ChromeRoom>(NONE);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a swapped bar is a new node to watch
  useEffect(() => {
    const measure = () => {
      const box = frame.current?.getBoundingClientRect();
      const upper = top.current?.getBoundingClientRect();
      const lower = bottom.current?.getBoundingClientRect();
      const panel = side.current?.getBoundingClientRect();
      if (box === undefined) return;
      const next = {
        top: upper === undefined ? 0 : Math.round(upper.bottom - box.top),
        bottom: lower === undefined ? 0 : Math.round(box.bottom - lower.top),
        right: panel === undefined ? 0 : Math.max(0, Math.round(box.right - panel.left)),
      };
      setRoom((was) =>
        was.top === next.top && was.bottom === next.bottom && was.right === next.right ? was : next,
      );
    };
    const observer = new ResizeObserver(measure);
    for (const node of [frame.current, top.current, bottom.current, side.current]) {
      if (node !== null) observer.observe(node);
    }
    measure();
    return () => observer.disconnect();
  }, [swapped]);
  return { frame, top, bottom, side, room };
}
