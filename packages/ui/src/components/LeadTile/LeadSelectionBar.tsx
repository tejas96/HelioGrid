import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import type { LeadSelectionBarProps } from './LeadTile.types';

/**
 * The bar a selection raises over the queue (`M02-29`): how many are ticked, *Assign* — one target
 * for them all, through the picker — and the way to clear. It speaks its count as it changes.
 */
export function LeadSelectionBar({ count, onAssign, onClear, words }: LeadSelectionBarProps) {
  return (
    <section className="hg-lead-selection" aria-label={words.selected(count)}>
      <span className="hg-lead-selection-count" aria-live="polite">
        {words.selected(count)}
      </span>
      <span className="hg-lead-tile-grow" />
      <Button
        variant="primary"
        size="sm"
        icon={<ShellGlyph name="user-plus" size="sm" tone="inverse" />}
        onClick={onAssign}
      >
        {words.assign}
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        {words.clear}
      </Button>
    </section>
  );
}
