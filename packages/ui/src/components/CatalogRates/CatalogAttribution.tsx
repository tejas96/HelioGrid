import { Button } from '../Button';
import { useMoreFocus } from '../CatalogItems/use-more-focus';
import { useRetryFocus } from '../CatalogItems/use-retry-focus';
import { DataTable } from '../DataTable';
import { EmptyState } from '../EmptyState';
import { ATTRIBUTION_STACK_BELOW, attributionColumns } from './CatalogRates.attribution';
import type { CatalogAttributionProps, CatalogAttributionRow } from './CatalogRates.types';

/**
 * *Why a price is what it is* (`SCR-M01-15` m15-d): every item the company changed, as cards, each
 * field beside the layer that supplied it. The web draws it in its 375 layout only.
 */
export function CatalogAttribution(props: CatalogAttributionProps) {
  const { words, rows, onMore } = props;
  const focus = useMoreFocus<HTMLElement>(onMore !== null);
  const retry = useRetryFocus(props.surface);
  if (props.surface === 'loading') return null;
  if (props.surface === 'error') {
    return (
      <EmptyState
        glow={false}
        title={words.loadFailed}
        action={
          <Button variant="secondary" size="sm" onClick={retry.retrying(props.onRetry)}>
            {words.tryAgain}
          </Button>
        }
      />
    );
  }
  return (
    /* After *Try again* focus lands on the whole table; after *Show more*, on the list it grew. */
    <div ref={retry.target} tabIndex={-1} className="hg-cat-attrib-retry">
      <section ref={focus.target} tabIndex={-1} className="hg-cat-attrib">
        <DataTable<CatalogAttributionRow>
          columns={attributionColumns(words)}
          rows={[...rows]}
          rowKey="id"
          stackBelow={ATTRIBUTION_STACK_BELOW}
          density="compact"
          caption={words.caption}
        />
        {onMore === null ? null : (
          <Button variant="ghost" size="sm" onClick={focus.pressing(onMore)}>
            {words.more}
          </Button>
        )}
      </section>
    </div>
  );
}
