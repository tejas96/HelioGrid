import type { CatalogEditorSwitches } from './CatalogPriceEditor.types';

/** A platform item's two picker switches from the editor's draft, each its override once set. */
export function catalogEditorSwitches(draft: {
  readonly hidden: boolean;
  readonly preferred: boolean;
  setHidden(hidden: boolean): void;
  setPreferred(preferred: boolean): void;
}): CatalogEditorSwitches {
  return {
    hidden: draft.hidden,
    onHidden: draft.setHidden,
    hiddenFromOverride: draft.hidden,
    preferred: draft.preferred,
    onPreferred: draft.setPreferred,
    preferredFromOverride: draft.preferred,
  };
}
