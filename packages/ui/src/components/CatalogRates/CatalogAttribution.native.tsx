import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RetryButton } from '../Button/RetryButton.native';
import { ShowMore } from '../CatalogItems/ShowMore.native';
import { DataTable } from '../DataTable/DataTable.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { ATTRIBUTION_STACK_BELOW, attributionColumns } from './CatalogRates.attribution';
import type { CatalogAttributionProps, CatalogAttributionRow } from './CatalogRates.types';

/**
 * *Why a price is what it is* on the phone (`SCR-M01-15` m15-d): every item the company changed,
 * as cards, each field beside the layer that supplied it.
 */
export function CatalogAttribution(props: CatalogAttributionProps) {
  /* After *Try again* the screen reader lands on the whole table, which stays while it reloads;
     after *Show more*, on the list it grew. */
  const frame = useRef<View>(null);
  const list = useRef<View>(null);
  return (
    <View ref={frame}>
      <AttributionBody {...props} frame={frame} list={list} />
    </View>
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
  frame: RefObject<View | null>;
  list: RefObject<View | null>;
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
    <View ref={list} style={styles.table}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  table: { gap: theme.spacing['sp-2'] },
});
