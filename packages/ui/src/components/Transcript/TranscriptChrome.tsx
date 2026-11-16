import { ShellGlyph } from '../AppShell/ShellGlyph';

/* Transcript's small shared furniture (web) — the globe glyph on the language line and on the
   in-flow switch marker. One declaration, so the two never drift apart. */

/** The mark beside the language words. A second channel beside them, never the carrier: the
    sentence always states the language in full. */
export function GlobeGlyph() {
  return <ShellGlyph name="globe" size="dense" tone="current" />;
}
