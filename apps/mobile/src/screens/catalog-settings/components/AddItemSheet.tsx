import type { CatalogItemWire } from '@heliogrid/contracts';
import { useAddCatalogItem } from '@heliogrid/data/react';
import type { ComponentKind } from '@heliogrid/domain';
import { type AddItemCaller, catalogAddItemWords, catalogItemFailuresOf } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogItemForm } from '@heliogrid/ui';

/**
 * The add sheet opened from Catalog settings on the phone (`SCR-M01-16`): `useAddCatalogItem`
 * holds the draft and the write, `catalogAddItemWords` words it, `CatalogItemForm` draws it as a
 * sheet. Mounted only while open, so each opening starts on a fresh form.
 */
export function AddItemSheet({
  priced,
  kind = 'panel',
  caller = 'settings',
  onClose,
  onAdded,
  onSpreadsheet,
}: {
  priced: boolean;
  /** The kind the form opens on; a picker opens it on the kind it is picking (`M01-39`). */
  kind?: ComponentKind;
  /** Who opened it: Catalog settings, or a picker adding a missing item in its own flow (`M06-28`). */
  caller?: AddItemCaller;
  onClose: () => void;
  onAdded: (item: CatalogItemWire) => void;
  onSpreadsheet: () => void;
}) {
  const { t } = useI18n();
  const add = useAddCatalogItem({ kind, priced, onAdded, onClose, onSpreadsheet });
  const { form } = add;
  const words = catalogAddItemWords(t, {
    kind: form.draft.kind,
    caller,
    schemes: form.schemes,
    priced,
    copiedFrom: add.copiedFrom,
  });
  const failures = catalogItemFailuresOf(t, add.failures);
  return <CatalogItemForm open words={words} failures={failures} priced={priced} {...form} />;
}
