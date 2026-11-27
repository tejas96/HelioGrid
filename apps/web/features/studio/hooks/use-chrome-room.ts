'use client';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

/** The room the bars take at the top and the foot of the canvas, in CSS pixels. */
export interface ChromeRoom {
  readonly top: number;
  readonly bottom: number;
}

const NONE: ChromeRoom = { top: 0, bottom: 0 };

/**
 * The web's measure of the canvas's bars: how far the head reaches down, and how far the part at
 * the foot reaches up — the bar, or the panel open in its place (a roof's sheet, Roofs, the
 * material picker) — so the camera frames the site in the room between them. It follows every
 * resize.
 */
export function useChromeRoom(
  /** Which part holds the foot (the bar, or a panel in its place): each new value measures again. */
  holder: string,
): {
  readonly frame: RefObject<HTMLDivElement | null>;
  readonly top: RefObject<HTMLDivElement | null>;
  readonly bottom: RefObject<HTMLDivElement | null>;
  readonly room: ChromeRoom;
} {
  const frame = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  // The part at the foot is a new node each time it comes back (a sheet that stepped aside for a
  // held arrow): each one is watched, or the room stays measured for the node that left.
  // biome-ignore lint/plugin: the web's own node at the foot, watched as it comes and goes
  const [lowerNode, setLowerNode] = useState<HTMLDivElement | null>(null);
  const bottom = useMemo<RefObject<HTMLDivElement | null>>(() => {
    let node: HTMLDivElement | null = null;
    return {
      get current() {
        return node;
      },
      set current(next) {
        node = next;
        setLowerNode(next);
      },
    };
  }, []);
  // biome-ignore lint/plugin: the web's own measure of laid-out boxes; the phone shows this page
  const [room, setRoom] = useState<ChromeRoom>(NONE);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new holder of the foot, or a new node of it, is a new node to watch
  useEffect(() => {
    // Each part's resting place in the frame's layout, never its box on the screen: a panel still
    // sliding up as it opens would read short.
    const measure = () => {
      const box = frame.current;
      if (box === null) return;
      const upper = top.current;
      const lower = bottom.current;
      const next = {
        top: upper === null ? 0 : upper.offsetTop + upper.offsetHeight,
        bottom: lower === null ? 0 : box.offsetHeight - lower.offsetTop,
      };
      setRoom((was) => (was.top === next.top && was.bottom === next.bottom ? was : next));
      // The part at the foot's height above the frame's own padding, for a message that must stand
      // over it (`studio-tools.css`).
      const padding = Number.parseFloat(getComputedStyle(box).paddingBottom) || 0;
      box.style.setProperty('--hg-foot-room', `${Math.max(0, next.bottom - padding)}px`);
    };
    const observer = new ResizeObserver(measure);
    for (const node of [frame.current, top.current, bottom.current]) {
      if (node !== null) observer.observe(node);
    }
    measure();
    return () => observer.disconnect();
  }, [holder, lowerNode]);
  return { frame, top, bottom, room };
}
