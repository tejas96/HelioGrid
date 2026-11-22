'use client';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { type Ref, useImperativeHandle, useRef } from 'react';

/** What the camera hands the compass each time it moves: the view's turn, in radians. */
export interface StudioCompassHandle {
  turn(radians: number): void;
}

/**
 * The map's compass, in the top-right corner: the needle alone, its red half pointing north, so it
 * needs no letter and no disc. The camera turns it each frame by writing to it directly, never
 * through a render.
 */
export function StudioCompass({
  handle,
  words,
  off,
}: {
  handle: Ref<StudioCompassHandle>;
  words: StudioCanvasWords;
  /** Put away by focus mode: on a phone while a length is set. */
  off: boolean;
}) {
  const needle = useRef<SVGSVGElement>(null);
  useImperativeHandle(handle, () => ({
    turn: (radians) => {
      if (needle.current !== null) needle.current.style.transform = `rotate(${radians}rad)`;
    },
  }));
  return (
    <span className="hg-studio-compass" data-off={off} title={words.north} aria-hidden>
      <svg
        ref={needle}
        className="hg-studio-needle"
        viewBox="0 0 12 24"
        aria-hidden="true"
        focusable="false"
      >
        <path className="hg-studio-needle-north" d="M6 1 10 12H2Z" />
        <path className="hg-studio-needle-south" d="M2 12h8L6 23Z" />
      </svg>
    </span>
  );
}
