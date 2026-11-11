import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text';
import { CardRows } from '../CardRows';
import { EmptyState } from '../EmptyState';
import { useFormat } from '../MarketProvider';
import { renderPending } from '../PendingAction';
import { CatalogItemRow } from './CatalogItemRow';
import { catalogRowPending } from './CatalogItems.rows';
import type { CatalogItemsProps } from './CatalogItems.types';
import './CatalogItemList.css';

/**
 * The list where the panel is narrow — a phone, or beside the docked editor (direction A): its
 * name and summary as a section head, then ONE glass card holding every row with a hairline
 * between, never a card per item. The card rises once; its rows never arrive one by one.
 */
export function CatalogItemList({
  props,
  toggles,
  focusAfter,
  foot,
}: {
  props: CatalogItemsProps;
  /** Each row keeps its two toggles — a desktop's room beside the docked editor; never a phone's. */
  toggles: boolean;
  focusAfter: FocusAfter;
  /** The pager or the growing list's foot, and the archived caption, under the card. */
  foot: ReactNode;
}) {
  const { words, rows, rowStates } = props;
  const format = useFormat();
  return (
    <section className="hg-cat-list" aria-label={words.region}>
      <header className="hg-cat-list-head">
        <Text as="h2" variant="h4">
          {words.region}
        </Text>
        <Text variant="caption" color="secondary">
          {words.summary}
        </Text>
      </header>
      {rows.length === 0 ? (
        <EmptyState scene="settle" title={words.table.emptyTitle} />
      ) : (
        <CardRows form="joined">
          {rows.map((row, index) => {
            const status = rowStates[row.id];
            const pending = catalogRowPending(status, words, focusAfter);
            return (
              <CatalogItemRow
                key={row.id}
                row={row}
                props={props}
                toggles={toggles}
                pending={renderPending(pending)}
                waiting={status?.state === 'saving'}
                money={(amount) => format.money(amount)}
                first={index === 0}
              />
            );
          })}
        </CardRows>
      )}
      {foot}
    </section>
  );
}
