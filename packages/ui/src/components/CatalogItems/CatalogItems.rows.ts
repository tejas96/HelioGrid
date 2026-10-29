import type { TranslatedText } from '@heliogrid/contracts';
import type { ComponentKind } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { DataTableLeading } from '../DataTable/DataTableColumn.types';
import type { PendingActionSpec } from '../PendingAction/PendingAction.types';
import type { CatalogRowStatus } from './CatalogItems.types';

/**
 * The own width at and above which a panel is the 1536 answer — the one-line table, the kind chips
 * with *All*, the sort menu — and below which it is the phone's cards. The 1536 page beside its
 * settings list leaves the panel about 1100 wide; a phone leaves it 343.
 */
export const CATALOG_WIDE_FROM = 720;

/** A kind's tile: the glyph on its iris, as `Avatar` and `Badge` tint a kind (`D268`). */
export const CATALOG_KIND_LEADING: Readonly<Record<ComponentKind, DataTableLeading>> = {
  panel: { glyph: 'solar-panel', iris: 'violet' },
  inverter: { glyph: 'inverter', iris: 'blue' },
  micro_inverter: { glyph: 'inverter', iris: 'blue' },
  optimiser: { glyph: 'inverter', iris: 'blue' },
  battery: { glyph: 'battery', iris: 'magenta' },
};

/**
 * A row's write as the table's pending line: out and unconfirmed, or back with what did not save
 * and what is therefore still true, with *Try again* and *Dismiss* in the panel's words.
 */
export function catalogRowPending(
  status: CatalogRowStatus | undefined,
  words: { readonly tryAgain: TranslatedText; readonly dismiss: TranslatedText },
  focusAfter: FocusAfter,
): PendingActionSpec | null {
  if (status === undefined) return null;
  if (status.state === 'saving') return { state: 'waiting', label: status.label };
  return {
    state: 'returned',
    label: status.label,
    reason: status.reason,
    onRetry: status.onRetry,
    retryLabel: words.tryAgain,
    onDismiss: status.onDismiss,
    dismissLabel: words.dismiss,
    focusAfter,
  };
}
