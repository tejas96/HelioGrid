'use client';
import { useCatalogChanged } from '@heliogrid/data/react';
import { catalogAttributionRowOf, catalogAttributionWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CatalogAttribution, surfaceOf, useCatalogFormats } from '@heliogrid/ui';

/**
 * *Why a price is what it is* under the rates in the 375 layout (`SCR-M01-15` m15-d); the 1536
 * Rates tab draws none, its items table carries the same attribution. Nothing changed: no table;
 * a failed read says so, with *Try again*.
 */
export function ChangedItems({ total }: { total: number }) {
  const { t } = useI18n();
  const formats = useCatalogFormats();
  const changed = useCatalogChanged(true);
  const rows = changed.items.flatMap((item) => catalogAttributionRowOf(t, item, formats) ?? []);
  const surface = surfaceOf(changed.status);
  if (surface === 'ready' && rows.length === 0) return null;
  return (
    <CatalogAttribution
      words={catalogAttributionWords(t, { changed: changed.totalCount, total }, formats.number)}
      surface={surface}
      onRetry={() => void changed.refetch()}
      rows={rows}
      onMore={changed.hasNextPage ? () => void changed.fetchNextPage() : null}
    />
  );
}
