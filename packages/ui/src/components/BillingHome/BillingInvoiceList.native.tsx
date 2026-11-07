import { theme } from '@heliogrid/theme';
import { type RefObject, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { type FocusHandle, useFocusAfter } from '../../primitives/FocusAfter';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { EditorSurface } from '../EditorSurface/EditorSurface.native';
import { FilterChips } from '../FilterBar/FilterChips.native';
import { Provenance } from '../Provenance/Provenance.native';
import { SearchField } from '../SearchField/SearchField.native';
import type { BillingInvoiceListProps } from './BillingHome.parts.types';
import { InvoiceRow } from './BillingInvoiceRows.native';

type Chip = BillingInvoiceListProps['chip'];

/**
 * `All invoices` on the phone (decision 12, frames 19 and 20): a full sheet whose head holds the
 * search and the state chips with their counts while the list scrolls; every invoice as the
 * home draws its latest, the source under them, and `Show more` while more remain.
 */
export function BillingInvoiceList(props: BillingInvoiceListProps) {
  const { words } = props;
  const search = useRef<FocusHandle>(null);
  return (
    <EditorSurface
      open={props.open}
      onClose={props.onClose}
      closeLabel={words.close}
      showClose
      size="full"
      density="expressive"
      title={words.title}
      meta={
        <View style={styles.head}>
          <SearchField
            ref={search}
            ariaLabel={words.findInList}
            placeholder={words.findInList}
            value={props.query}
            onChange={props.onSearch}
            onClear={() => props.onSearch('')}
            clearLabel={words.clearSearch}
          />
          <FilterChips
            label={words.invoiceState}
            value={props.chip}
            onChange={(value) => props.onChip(value as Chip)}
            scroll
            options={[
              { value: 'all', label: words.all },
              { value: 'paid', label: words.paid },
              { value: 'failed', label: words.failed },
            ]}
            counts={props.counts}
          />
        </View>
      }
      read={props.read}
      loadingLabel={words.loading}
      errorTitle={words.failedTitle}
      retryLabel={words.tryAgain}
    >
      <InvoiceListBody {...props} search={search} />
    </EditorSurface>
  );
}

function InvoiceListBody({
  search,
  ...props
}: BillingInvoiceListProps & { search: RefObject<FocusHandle | null> }) {
  const { words } = props;
  const clearing = useFocusAfter(search);
  if (props.rows.length === 0 && props.query !== '') {
    return (
      <Block
        density="expressive"
        read={{ kind: 'empty' }}
        loadingLabel={words.loading}
        emptyTitle={words.noMatch(props.query)}
        emptyMessage={words.noMatchLine}
        emptyAction={
          <Button variant="secondary" size="md" onClick={clearing(() => props.onSearch(''))}>
            {words.clearSearch}
          </Button>
        }
        style={styles.flat}
      />
    );
  }
  return (
    <View style={styles.rows}>
      {props.rows.map((row) => (
        <InvoiceRow
          key={row.id}
          row={row}
          pending={props.pendingPdf === row.id}
          waiting={props.pendingPdf !== null}
          onPdf={props.onPdf}
        />
      ))}
      {props.more ? (
        <View style={styles.start}>
          <Button variant="secondary" size="md" onClick={props.onShowMore}>
            {words.showMore}
          </Button>
        </View>
      ) : null}
      {props.source === null ? null : (
        <Provenance tier="unmarked" source={props.source} size={12} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: theme.spacing['sp-3'] },
  rows: { gap: theme.layout['tile-gap'] },
  /** The empty answer sits on the sheet's own edges, as the board's flat block does. */
  flat: { padding: 0 },
  start: { flexDirection: 'row' },
});
