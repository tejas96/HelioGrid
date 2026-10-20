import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { ACTIVITY_GLYPH, FALLBACK_GLYPH } from './ActivityGlyph.logic';

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
      <ShellGlyphMarks name={ACTIVITY_GLYPH[name] ?? FALLBACK_GLYPH} />
    </svg>
  );
}
