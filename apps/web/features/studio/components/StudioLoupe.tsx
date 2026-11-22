'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem } from '@heliogrid/domain';
import { useFormat, usePalette } from '@heliogrid/ui';
import { type RefObject, useLayoutEffect, useRef } from 'react';
import type { StudioDrive } from './StudioCameraRig';

/** The loupe's size and how much larger it shows the spot, in CSS pixels. */
const LOUPE_PX = 108;
const ZOOM = 1.6;
/** How far above the finger the loupe sits; near the top it sits beside the finger instead. */
const ABOVE_PX = 104;
const BESIDE_PX = 112;
const CROSS_PX = 9;

type Xy = { x: number; y: number };

/** The points of a path drawn with moves and lines only, as the roof marks draw theirs. */
function pointsOf(d: string): Xy[] {
  const points: Xy[] = [];
  for (const [, x, y] of d.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)) {
    points.push({ x: Number(x), y: Number(y) });
  }
  return points;
}

/** The roof's lines, as the marks drew them, stroked in the loupe's frame. */
function strokeLines(pen: CanvasRenderingContext2D, into: (p: Xy) => Xy, ink: string, dpr: number) {
  pen.lineWidth = 2 * dpr;
  pen.lineJoin = 'round';
  pen.strokeStyle = ink;
  const paths = document.querySelectorAll<SVGPathElement>(
    '.hg-roof-lines .hg-roof-line, .hg-roof-lines .hg-roof-stretch',
  );
  for (const path of paths) {
    const points = pointsOf(path.getAttribute('d') ?? '').map(into);
    if (points.length < 2) continue;
    pen.beginPath();
    for (const [i, p] of points.entries()) {
      if (i === 0) pen.moveTo(p.x, p.y);
      else pen.lineTo(p.x, p.y);
    }
    pen.stroke();
  }
}

/** A cross on the spot, in the middle of the loupe. */
function strokeCross(pen: CanvasRenderingContext2D, ink: string, dpr: number) {
  const middle = (LOUPE_PX / 2) * dpr;
  const arm = CROSS_PX * dpr;
  pen.strokeStyle = ink;
  pen.lineWidth = dpr;
  pen.beginPath();
  pen.moveTo(middle - arm, middle);
  pen.lineTo(middle + arm, middle);
  pen.moveTo(middle, middle - arm);
  pen.lineTo(middle, middle + arm);
  pen.stroke();
}

/**
 * The scene under the finger, larger, with the roof's lines and a cross on the spot. The scene
 * draws the spot again at the loupe's own size, so it is sharper there than on the screen under
 * the finger.
 */
function drawLoupe(
  out: HTMLCanvasElement,
  at: Xy,
  line: string,
  mark: string,
  drive: StudioDrive | null,
): void {
  const scene = document.querySelector<HTMLCanvasElement>('.hg-studio-scene canvas');
  const pen = out.getContext('2d');
  if (scene === null || pen === null || drive === null) return;
  const dpr = window.devicePixelRatio || 1;
  const side = Math.round(LOUPE_PX * dpr);
  if (out.width !== side || out.height !== side) {
    out.width = side;
    out.height = side;
  }
  const box = scene.getBoundingClientRect();
  const x = at.x - box.left;
  const y = at.y - box.top;
  drive.drawRound(at.x, at.y, LOUPE_PX / ZOOM, out);
  const into = (p: Xy) => ({
    x: ((p.x - x) * ZOOM + LOUPE_PX / 2) * dpr,
    y: ((p.y - y) * ZOOM + LOUPE_PX / 2) * dpr,
  });
  strokeLines(pen, into, line, dpr);
  strokeCross(pen, mark, dpr);
}

/**
 * The phone's loupe (`T-M05-002`, part b): while a finger aims a corner, the spot under it shows
 * larger, above the finger, with the roof's lines and a cross on the spot, and the live length
 * under it. It shows what the scene and the marks draw; it holds nothing of its own.
 */
export function StudioLoupe({
  at,
  studio,
  units,
  drive,
}: {
  /** Where the finger is, in client pixels. */
  at: { x: number; y: number };
  studio: StudioScreen;
  units: MeasurementSystem;
  /** The scene's own hand, which draws the spot under the finger for the loupe. */
  drive: RefObject<StudioDrive | null>;
}) {
  const palette = usePalette();
  const format = useFormat();
  const canvas = useRef<HTMLCanvasElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const near = at.y < ABOVE_PX + LOUPE_PX / 2;
  const left = near ? at.x + (at.x > window.innerWidth / 2 ? -BESIDE_PX : BESIDE_PX) : at.x;
  const top = near ? at.y : at.y - ABOVE_PX;
  const draft = studio.draft;
  const stretch = draft?.stretch ?? null;
  const live = stretch === null ? null : format.roofLength(stretch.metres, units, true);

  useLayoutEffect(() => {
    if (lens.current !== null) {
      lens.current.style.transform = `translate(${left}px, ${top}px) translate(-50%, -50%)`;
    }
    if (label.current !== null) {
      const under = top + LOUPE_PX / 2 + CROSS_PX * 2;
      label.current.style.transform = `translate(${left}px, ${under}px) translate(-50%, 0)`;
    }
    if (canvas.current !== null) {
      drawLoupe(canvas.current, at, palette['scene-line'], palette['scene-mark'], drive.current);
    }
  });

  return (
    <>
      <span ref={lens} className="hg-roof-loupe" aria-hidden>
        <canvas ref={canvas} />
      </span>
      {live === null ? null : (
        <span ref={label} className="hg-roof-loupe-len" aria-hidden>
          <span className="hg-roof-len" data-kind="traced" data-live="true">
            {live}
          </span>
        </span>
      )}
    </>
  );
}
