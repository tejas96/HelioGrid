import { isValidElement } from 'react';
import type { OptionCardItem } from './OptionCardGroup.types';

/**
 * Does this option have a reason to hear? An exact mirror of `renderActionReason`'s own decision,
 * without either platform's renderer — a sentence, a spec with words in it, or a ready node.
 *
 * The arrow-key walk asks it before any card has rendered, and it has to give the answer the cards
 * give: an option with a stated reason is walked onto and is `aria-disabled` rather than natively
 * disabled (law 9), and one with nothing to hear is skipped and inert. The cards themselves read
 * the rendered node, so the two can never drift.
 */
export function hasReason(option: OptionCardItem): boolean {
  const spec = option.disabledReason;
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return false;
  }
  if (isValidElement(spec) || typeof spec === 'string') {
    return true;
  }
  if (typeof spec !== 'object' || !('reason' in spec)) {
    return false;
  }
  const { reason } = spec;
  return reason !== undefined && reason !== null && reason !== false && reason !== '';
}
