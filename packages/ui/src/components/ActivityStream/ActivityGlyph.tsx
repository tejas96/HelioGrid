import { ShellGlyph } from '../AppShell/ShellGlyph';
import { nearestGlyphSize } from '../AppShell/ShellGlyph.logic';
import { activityGlyphOf, agentObjectSize } from './ActivityGlyph.logic';

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
        style={{ width: agentObjectSize(size), height: agentObjectSize(size) }}
      />
    );
  }
  return <ShellGlyph name={activityGlyphOf(name)} size={nearestGlyphSize(size)} tone="current" />;
}
