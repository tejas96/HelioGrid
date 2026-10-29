'use client';
import { useCatalogChanged } from '@heliogrid/data/react';
import { catalogAttributionRowOf, catalogAttributionWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogAttribution, useCatalogFormats } from '@heliogrid/ui';

/**
 * *Why a price is what it is* under the rates in the 375 layout (`SCR-M01-15` m15-d); the 1536
 * Rates tab draws none, its items table carries the same attribution. Nothing changed: no table;
 * a failed read says so, with *Try again*.
 */
export function ChangedItems({ total }: { total: number }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const changed = useCatalogChanged(true);
  const { read } = changed;
  const items = read.kind === 'ready' ? read.value : [];
  const rows = items.flatMap((item) => catalogAttributionRowOf(t, item, formats) ?? []);
  if (read.kind === 'ready' && rows.length === 0) return null;
  return (
    <CatalogAttribution
      words={catalogAttributionWords(t, { changed: changed.totalCount, total }, formats.number)}
      read={read}
      rows={rows}
      onMore={changed.hasNextPage ? () => void changed.fetchNextPage() : null}
    />
  );
}
