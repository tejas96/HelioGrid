import type { TranslatedText } from '@heliogrid/contracts';
import { useRef } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { Text } from '../../primitives/Text/Text';
import { useOwnWidth } from '../../primitives/use-own-width';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { Block } from '../Block';
import { Button } from '../Button';
import { RetryButton } from '../Button/RetryButton';
import { DataTable, Pagination } from '../DataTable';
import { EmptyState } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { useFormat } from '../MarketProvider';
import { CATALOG_WIDE_FROM, catalogRowPending } from './CatalogItems.rows';
import type {
  CatalogItemsProps,
  CatalogItemsWords,
  CatalogPaging,
  CatalogRow,
} from './CatalogItems.types';
import { narrowColumns, wideColumns } from './CatalogItemsColumns';
import { CatalogItemsControls } from './CatalogItemsControls';
import { CatalogRowActs } from './CatalogRowActs';
import { CatalogStripBar } from './CatalogStrip';
import { useLoadMore } from './use-load-more';
import './CatalogItems.css';

/** Six placeholder rows, in the list's own rhythm, while the read is out. */
const LOADING_ROWS = ['row', 'row', 'row', 'row', 'row', 'row'] as const;

/**
 * Catalog settings' *Items* panel on the web: the release strip, the view-only line or the
 * first-day card, the search with its filters, and one resolved list — the one-line table in a wide
 * room and the phone's cards in a narrow one, sized from the panel's own width. Every act is
 * absent without the grant, never disabled.
 */
export function CatalogItems(props: CatalogItemsProps) {
  const { words, read } = props;
  const [room, width] = useOwnWidth();
  const wide = width !== null && width >= CATALOG_WIDE_FROM;
  /* A dismissed row's line hands the keyboard to the strip's title, which stays. */
  const stripTitle = useRef<HTMLDivElement>(null);

  /* *Try again* leaves with the failure: focus goes to the panel, which stays while it reloads. */
  if (read.kind === 'failed') {
    return (
      <div ref={room} tabIndex={-1} className="hg-cat-items hg-focus-target">
        <EmptyState
          glow={false}
          icon={<ShellGlyph name="alert-circle" size="xl" />}
          title={words.loadFailed}
          description={words.loadFailedBody}
          action={
            <RetryButton size="lg" onRetry={read.retry} label={words.tryAgain} focusAfter={room} />
          }
        />
      </div>
    );
  }

  const loading = read.kind === 'loading';
  return (
    <div
      ref={room}
      tabIndex={-1}
      className="hg-cat-items hg-focus-target"
      data-wide={wide ? 'true' : undefined}
    >
      {loading ? (
        <LoadingBars label={words.loadingRelease} bars={['row']} />
      ) : (
        <CatalogStripBar strip={props.strip} focusRef={stripTitle} />
      )}
      {props.viewOnly === null ? null : (
        <Banner kind="info" density="functional" title={props.viewOnly} />
      )}
      {props.teaching === null || loading ? null : (
        <Block overline={words.makeItYours} density="functional">
          <Text variant="body-sm" color="secondary">
            {props.teaching}
          </Text>
        </Block>
      )}
      {wide ? <ListEntries props={props} wide /> : null}
      <CatalogItemsControls
        words={words}
        query={props.query}
        onQuery={props.onQuery}
        filter={props.filter}
        onFilter={props.onFilter}
        sort={props.sort}
        onSort={props.onSort}
        schemes={props.schemes}
        wide={wide}
        resultCount={props.paging.rowCount}
        loadingKinds={loading}
      />
      {loading ? (
        <section className="hg-cat-list" aria-label={words.region}>
          <Text variant="overline" color="secondary">
            {words.region}
          </Text>
          <LoadingBars label={words.loadingList} bars={LOADING_ROWS} />
        </section>
      ) : (
        <CatalogList {...props} wide={wide} focusAfter={stripTitle} />
      )}
      {wide || loading ? null : <ListEntries props={props} wide={false} />}
    </div>
  );
}

/**
 * *Add an item* and *Import a file*: at 1536 they head the list's controls, right-aligned, the
 * import raised and the add the act; at 375 they close the list, centred, the add raised and the
 * import quiet — where an owner concludes an item is missing (`SCR-M01-15`, `SCR-M01-16`).
 */
function ListEntries({ props, wide }: { props: CatalogItemsProps; wide: boolean }) {
  const { onAdd, onImport, words } = props;
  if (onAdd === null && onImport === null) return null;
  const add = onAdd === null ? null : <AddEntry onAdd={onAdd} label={words.addItem} wide={wide} />;
  const importing =
    onImport === null ? null : (
      <ImportEntry onImport={onImport} label={words.importFile} wide={wide} />
    );
  return (
    <div className="hg-cat-entry" data-wide={wide ? 'true' : undefined}>
      {wide ? importing : add}
      {wide ? add : importing}
    </div>
  );
}

interface EntryProps {
  label: TranslatedText;
  wide: boolean;
}

function AddEntry({ onAdd, label, wide }: EntryProps & { onAdd: () => void }) {
  const glyph = (
    <ShellGlyph name="plus" size={wide ? 'sm' : 'md'} tone={wide ? 'inverse' : 'primary'} />
  );
  return (
    <Button variant={wide ? 'primary' : 'secondary'} size="sm" onClick={onAdd} icon={glyph}>
      {label}
    </Button>
  );
}

function ImportEntry({ onImport, label, wide }: EntryProps & { onImport: () => void }) {
  const glyph = <ShellGlyph name="upload" size={wide ? 'sm' : 'md'} tone="primary" />;
  return (
    <Button variant={wide ? 'secondary' : 'ghost'} size="sm" onClick={onImport} icon={glyph}>
      {label}
    </Button>
  );
}

/** The list, its pager or its growing foot, and the archived count's caption under it. */
function CatalogList(props: CatalogItemsProps & { wide: boolean; focusAfter: FocusAfter }) {
  const { words, wide, administers } = props;
  const format = useFormat();
  const facts = {
    words,
    schemes: props.schemes,
    administers,
    money: (amount: string) => format.money(amount),
  };
  const acts = (row: CatalogRow, form: { stacked: boolean }) => (
    <CatalogRowActs row={row} stacked={form.stacked} acts={props} />
  );
  const table = {
    ...words.table,
    read: props.read,
    rows: [...props.rows],
    rowKey: 'id',
    columns: wide ? wideColumns(facts) : narrowColumns(facts),
    caption: words.region,
    summary: wide ? undefined : words.summary,
    head: wide ? ('quiet' as const) : ('overline' as const),
    density: 'compact' as const,
    stackBelow: CATALOG_WIDE_FROM,
    rowLabel: (row: CatalogRow) => row.labels.row,
    isRowMuted: (row: CatalogRow) => row.archived,
    isRowHighlighted: (row: CatalogRow) => row.id === props.addedId,
    rowPending: (row: CatalogRow) =>
      catalogRowPending(props.rowStates[row.id], words, props.focusAfter),
    onRowClick: administers ? props.onOpen : undefined,
    rowOpens: (row: CatalogRow) => !row.archived,
  };
  return (
    <section className="hg-cat-list">
      {administers ? (
        /* The acts column is named by its blank head, as the board draws it: the catalog's words
           carry no name for it, and each act speaks its own whole name. */
        <DataTable<CatalogRow> {...table} actionsLabel={words.actions} rowActions={acts} />
      ) : (
        <DataTable<CatalogRow> {...table} />
      )}
      <ListFoot paging={props.paging} words={words} />
      {props.archivedCaption === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {props.archivedCaption}
        </Text>
      )}
    </section>
  );
}

/** A numbered page at 1536; at 375 the next page comes as the list's foot comes into view. */
function ListFoot({ paging, words }: { paging: CatalogPaging; words: CatalogItemsWords }) {
  const foot = useLoadMore(paging.kind === 'more' && paging.hasMore && !paging.loadingMore, () => {
    if (paging.kind === 'more') paging.onMore();
  });
  if (paging.kind === 'pages') {
    return (
      <Pagination
        /* The caller counts pages from 1, as the list's read does; the pager counts from 0. */
        page={paging.page}
        pageSize={paging.pageSize}
        rowCount={paging.rowCount}
        onPageChange={paging.onPage}
        previousLabel={words.previousPage}
        nextLabel={words.nextPage}
        readout={({ from, to, count }) => words.pageRange(from, to, count)}
      />
    );
  }
  return (
    <div className="hg-cat-more" ref={foot}>
      {paging.loadingMore ? <LoadingBars label={words.loadingList} bars={['row']} /> : null}
    </div>
  );
}
