import type { CatalogEditorOwnActs, CatalogEditorSwitches } from './CatalogPriceEditor.types';

/** A platform item's two picker switches from the editor's draft. */
export function catalogEditorSwitches(draft: {
  readonly hidden: boolean;
  readonly preferred: boolean;
  setHidden(hidden: boolean): void;
  setPreferred(preferred: boolean): void;
}): CatalogEditorSwitches {
  return {
    hidden: draft.hidden,
    onHidden: draft.setHidden,
    preferred: draft.preferred,
    onPreferred: draft.setPreferred,
  };
}

/**
 * An own SKU's acts in its sheet or panel (direction A's *Prefer* and *Archive*), done at once as its
 * row's were: the preference is read live from the item's row in the list, so the button follows
 * the write; *Archive* closes the editor first, since the item it shows is leaving the list.
 * `null` for a platform item, or while the row is not in the list.
 */
export function catalogEditorOwnActs<
  Row extends { readonly id: string; readonly preferred: boolean },
>(
  opened: { readonly id: string; readonly source: 'platform_item' | 'own_item' } | null,
  rows: readonly Row[],
  acts: {
    readonly onPrefer: (row: Row) => void;
    readonly onArchive: (row: Row) => void;
    readonly close: () => void;
  },
): CatalogEditorOwnActs | null {
  if (opened === null || opened.source !== 'own_item') return null;
  const row = rows.find((each) => each.id === opened.id);
  if (row === undefined) return null;
  return {
    preferred: row.preferred,
    onPrefer: () => acts.onPrefer(row),
    onArchive: () => {
      acts.close();
      acts.onArchive(row);
    },
  };
}
