import { type RefObject, useRef } from 'react';
import { RetryButton } from '../Button/RetryButton';
import { ShowMore } from '../CatalogItems/ShowMore';
import { DataTable } from '../DataTable';
import { EmptyState } from '../EmptyState';
import { ATTRIBUTION_STACK_BELOW, attributionColumns } from './CatalogRates.attribution';
import type { CatalogAttributionProps, CatalogAttributionRow } from './CatalogRates.types';

/**
 * *Why a price is what it is* (`SCR-M01-15` m15-d): every item the company changed, as cards, each
 * field beside the layer that supplied it. The web draws it in its 375 layout only.
 */
export function CatalogAttribution(props: CatalogAttributionProps) {
  /* After *Try again* focus lands on the whole table, which stays while it reloads; after *Show
     more*, on the list it grew. */
  const frame = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLElement>(null);
  return (
    <div ref={frame} tabIndex={-1} className="hg-cat-attrib-retry hg-focus-target">
      <AttributionBody {...props} frame={frame} list={list} />
    </div>
  );
}

function AttributionBody({
  words,
  rows,
  onMore,
  read,
  frame,
  list,
}: CatalogAttributionProps & {
  frame: RefObject<HTMLDivElement | null>;
  list: RefObject<HTMLElement | null>;
}) {
  if (read.kind === 'loading') return null;
  if (read.kind === 'failed') {
    return (
      <EmptyState
        glow={false}
        title={words.loadFailed}
        action={
          <RetryButton size="sm" onRetry={read.retry} label={words.tryAgain} focusAfter={frame} />
        }
      />
    );
  }
  return (
    <section ref={list} tabIndex={-1} className="hg-cat-attrib hg-focus-target">
      <DataTable<CatalogAttributionRow>
        {...words.table}
        read={read}
        columns={attributionColumns(words)}
        rows={[...rows]}
        rowKey="id"
        stackBelow={ATTRIBUTION_STACK_BELOW}
        density="compact"
        caption={words.caption}
      />
      {onMore === null ? null : <ShowMore label={words.more} onMore={onMore} focusAfter={list} />}
    </section>
  );
}
