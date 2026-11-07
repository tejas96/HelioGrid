import { useRef } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import { Block } from '../Block';
import { Button } from '../Button';
import { EditorSurface } from '../EditorSurface';
import { FilterChips } from '../FilterBar';
import { Provenance } from '../Provenance';
import { SearchField } from '../SearchField';
import type { BillingInvoiceListProps } from './BillingHome.parts.types';
import { BillingInvoiceRows, BillingInvoiceTable } from './BillingInvoiceRows';

/** The side panel's width at 1536 (brief decision 12); the design system has no panel token yet. */
const INVOICE_PANEL_WIDTH = 720;

type Chip = BillingInvoiceListProps['chip'];

/**
 * `All invoices` (decision 12, frames 19–20, d3–d4): `Find in this list` and the state chips over
 * every invoice — a sheet holding the list at 375, a non-modal panel holding the table at width.
 * No match offers `Clear search`, which hands the keyboard back to the search field.
 */
export function BillingInvoiceList(props: BillingInvoiceListProps) {
  const { open, onClose, words, read, query, chip, counts } = props;
  const search = useRef<FocusHandle>(null);
  const clear = () => {
    props.onSearch('');
    search.current?.focus({ preventScroll: true });
  };
  const head = (
    <div className="hg-billing-list-head">
      <SearchField
        ref={search}
        value={query}
        onChange={props.onSearch}
        placeholder={words.findInList}
        ariaLabel={words.findInList}
        onClear={query === '' ? undefined : clear}
        clearLabel={words.clearSearch}
      />
      <FilterChips
        label={words.invoiceState}
        value={chip}
        onChange={(value) => props.onChip(value as Chip)}
        scroll
        options={[
          { value: 'all', label: words.all },
          { value: 'paid', label: words.paid },
          { value: 'failed', label: words.failed },
        ]}
        counts={counts}
      />
    </div>
  );
  return (
    <EditorSurface
      open={open}
      onClose={onClose}
      closeLabel={words.close}
      showClose
      modal={false}
      desktop="panel"
      width={INVOICE_PANEL_WIDTH}
      size="full"
      density="expressive"
      title={words.title}
      meta={head}
      errorTitle={words.failedTitle}
      retryLabel={words.tryAgain}
      read={read}
      loadingLabel={words.loading}
    >
      {({ panel }) => <InvoiceListBody {...props} panel={panel} onClear={clear} />}
    </EditorSurface>
  );
}

/** The list's rows — the table in a panel, the list in a sheet — or no match with `Clear search`. */
function InvoiceListBody({
  panel,
  onClear,
  words,
  rows,
  query,
  more,
  range,
  source,
  pendingPdf,
  onPdf,
  onShowMore,
}: BillingInvoiceListProps & { panel: boolean; onClear: () => void }) {
  if (rows.length === 0) {
    const searched = query !== '';
    return (
      <Block
        density="expressive"
        read={{ kind: 'empty' }}
        loadingLabel={words.loading}
        emptyTitle={searched ? words.noMatch(query) : words.table.emptyTitle}
        emptyMessage={searched ? words.noMatchLine : undefined}
        emptyAction={
          searched ? (
            <Button variant="secondary" size="md" onClick={onClear}>
              {words.clearSearch}
            </Button>
          ) : undefined
        }
      />
    );
  }
  return (
    <div className="hg-billing-stack" data-gap={panel ? '3' : 'tile'}>
      {panel ? (
        <BillingInvoiceTable
          rows={rows}
          columns={words.columns}
          words={words.table}
          pendingPdf={pendingPdf}
          waiting={pendingPdf !== null}
          onPdf={onPdf}
          source={source}
        />
      ) : (
        <BillingInvoiceRows
          rows={rows}
          pendingPdf={pendingPdf}
          waiting={pendingPdf !== null}
          onPdf={onPdf}
        />
      )}
      <div className="hg-billing-list-foot">
        {panel && range !== null ? <span className="hg-billing-range">{range}</span> : null}
        {more ? (
          <Button variant="secondary" size="md" onClick={onShowMore}>
            {words.showMore}
          </Button>
        ) : null}
        {!panel && source !== null ? <Provenance source={source} size={12} /> : null}
      </div>
    </div>
  );
}
