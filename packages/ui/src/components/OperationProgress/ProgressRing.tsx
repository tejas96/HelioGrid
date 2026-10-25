import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RING_TURN, type RingGeometry, ringDrawing } from './progress-ring';

interface ProgressRingProps {
  geometry: RingGeometry;
  /** 0–1 of the ring the arc covers; 0 draws the track alone. */
  share: number;
}

/**
 * A track and an arc. The arc's ink is `--hg-ring-ink` from whatever holds it, the accent when
 * nothing sets one. Decorative: the element holding it carries the name and the value. The arc
 * never animates — a stroke offset is not a transform (`ui-adherence.md`, Motion).
 */
export function ProgressRing({ geometry, share }: ProgressRingProps) {
  const ring = ringDrawing(geometry, share);
  return (
    <svg
      className="hg-progress-ring"
      width={geometry.box}
      height={geometry.box}
      viewBox={ring.viewBox}
      fill="none"
      strokeWidth={ring.strokeWidth}
      aria-hidden="true"
    >
      <g className="hg-progress-ring-track">
        <ShellGlyphMarks name="ring" />
      </g>
      {share > 0 ? (
        <g
          className="hg-progress-ring-arc"
          strokeLinecap="round"
          strokeDasharray={ring.circumference}
          strokeDashoffset={ring.offset}
          transform={RING_TURN}
        >
          <ShellGlyphMarks name="ring" />
        </g>
      ) : null}
    </svg>
  );
}
