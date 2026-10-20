import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';

/** The overflow trigger's three dots. */
export function OverflowGlyph() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <ShellGlyphMarks name="dots-small" />
    </svg>
  );
}

/**
 * A destructive item's own glyph. Danger colour is never the only channel — this trash mark is
 * what keeps the meaning alive in greyscale and for a colourblind reader.
 */
export function TrashGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="hg-menu-item-glyph"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="16"
    >
      <ShellGlyphMarks name="trash" />
    </svg>
  );
}

/** A destructive row's leading glyph, and nothing at all for an ordinary one. */
export function MenuLeadGlyph({ destructive }: { destructive: boolean }) {
  return destructive ? <TrashGlyph /> : null;
}

/**
 * The tick column, RESERVED on every switcher row — current or not — so the labels do not shift by
 * 22px when the current option moves.
 */
export function MenuTick({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className="hg-menu-item-tick">
      {checked ? <TickGlyph /> : null}
    </span>
  );
}

/** The switcher's tick — `selection="single"`'s non-colour channel beside `aria-checked`. */
export function TickGlyph() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="15"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="15"
    >
      <ShellGlyphMarks name="tick" />
    </svg>
  );
}
