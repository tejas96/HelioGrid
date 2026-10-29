import { reasonText } from '../ActionReason/ActionReason.logic';
import type { OptionCardItem } from './OptionCardGroup.types';

/**
 * Does this option have a reason to hear? The question `renderActionReason` asks before drawing
 * one — a sentence, a spec with words in it, or a ready node — without either platform's renderer.
 *
 * The arrow-key walk asks it before any card has rendered, and it has to give the answer the cards
 * give: an option with a stated reason is walked onto and is `aria-disabled` rather than natively
 * disabled (law 9), and one with nothing to hear is skipped and inert. The cards themselves read
 * the rendered node, so the two can never drift.
 */
export function hasReason(option: OptionCardItem): boolean {
  return reasonText(option.disabledReason) !== null;
}
