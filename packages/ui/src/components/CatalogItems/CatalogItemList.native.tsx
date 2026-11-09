import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text.native';
import { CardRows } from '../CardRows/CardRows.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { useFormat } from '../MarketProvider/market-context';
import { renderPending } from '../PendingAction/PendingAction.native';
import { CatalogItemRow } from './CatalogItemRow.native';
import { catalogRowPending } from './CatalogItems.rows';
import type { CatalogItemsProps } from './CatalogItems.types';

/**
 * The phone's list (direction A): its name and summary as a section head, then ONE glass card
 * (`CardRows`) holding every row with a hairline between — never a card per item — and the foot
 * under it.
 */
export function CatalogItemList({
  props,
  focusAfter,
  foot,
}: {
  props: CatalogItemsProps;
  focusAfter: FocusAfter;
  foot: ReactNode;
}) {
  const { words, rows, rowStates } = props;
  const format = useFormat();
  return (
    <View style={styles.list}>
      <View style={styles.head}>
        <View accessible accessibilityRole="header">
          <Text variant="h4">{words.region}</Text>
        </View>
        <Text variant="caption" color="secondary">
          {words.summary}
        </Text>
      </View>
      {rows.length === 0 ? (
        <EmptyState moment="empty-catalog" title={words.table.emptyTitle} />
      ) : (
        <CardRows>
          {rows.map((row, index) => {
            const status = rowStates[row.id];
            return (
              <CatalogItemRow
                key={row.id}
                row={row}
                props={props}
                pending={renderPending(catalogRowPending(status, words, focusAfter))}
                waiting={status?.state === 'saving'}
                money={(amount) => format.money(amount)}
                first={index === 0}
              />
            );
          })}
        </CardRows>
      )}
      {foot}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing['sp-2'] },
  head: {
    gap: theme.spacing['sp-0-5'],
    paddingTop: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-1'],
  },
});
