'use client';
import type { CatalogItemWire } from '@heliogrid/contracts';
import { useAddCatalogItem } from '@heliogrid/data/react';
import { catalogAddItemWords, catalogItemFailuresOf } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogItemForm } from '@heliogrid/ui';

/**
 * The add sheet opened from Catalog settings on the web (`SCR-M01-16`): `useAddCatalogItem` holds
 * the draft and the write, `catalogAddItemWords` words it, `CatalogItemForm` draws it as the 900px
 * panel. Mounted only while open, so each opening starts on a fresh form.
 */
export function AddItemPanel({
  priced,
  onClose,
  onAdded,
  onSpreadsheet,
}: {
  priced: boolean;
  onClose: () => void;
  onAdded: (item: CatalogItemWire) => void;
  onSpreadsheet: () => void;
}) {
  const { t } = useI18n();
  const add = useAddCatalogItem({ kind: 'panel', priced, onAdded, onClose, onSpreadsheet });
  const { form } = add;
  const words = catalogAddItemWords(t, {
    kind: form.draft.kind,
    caller: 'settings',
    schemes: form.schemes,
    priced,
    copiedFrom: add.copiedFrom,
  });
  const failures = catalogItemFailuresOf(t, add.failures);
  return <CatalogItemForm open words={words} failures={failures} priced={priced} {...form} />;
}
