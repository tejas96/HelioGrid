import { ACTIVITY_GLYPH, FALLBACK_GLYPH, type GlyphShape } from './ActivityGlyph.logic';

/** One shape, drawn with this platform's own SVG elements. The SHAPE is shared; these are not. */
function draw(shape: GlyphShape, key: number) {
  if (shape.kind === 'path') return <path key={key} d={shape.d} />;
  if (shape.kind === 'circle') return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  return (
    <rect
      key={key}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rx={shape.rx}
    />
  );
}

/**
 * A kind's glyph. `agent` is the one gradient in this component — brand/AI features take a
 * gradient-filled object rather than an outlined icon (readme, ICONOGRAPHY).
 */
export function ActivityGlyph({ name, size = 16 }: { name: string; size?: number }) {
  if (name === 'agent') {
    return (
      <span
        aria-hidden="true"
        className="hg-stream-agent-object"
        style={{ width: size - 2, height: size - 2 }}
      />
    );
  }
  const shapes = ACTIVITY_GLYPH[name] ?? ACTIVITY_GLYPH[FALLBACK_GLYPH];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="presentation"
    >
      {shapes?.map(draw)}
    </svg>
  );
}
