import { ShellGlyph } from '../AppShell/ShellGlyph';

/** The overflow trigger's three dots. */
export function OverflowGlyph() {
  return <ShellGlyph name="dots" size="sm" tone="current" />;
}

/**
 * A destructive item's own glyph. Danger colour is never the only channel — this trash mark is
 * what keeps the meaning alive in greyscale and for a colourblind reader.
 */
export function TrashGlyph() {
  return (
    <span className="hg-menu-item-glyph">
      <ShellGlyph name="trash" size="sm" tone="current" />
    </span>
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
  return <ShellGlyph name="check" size="dense" tone="current" />;
}
