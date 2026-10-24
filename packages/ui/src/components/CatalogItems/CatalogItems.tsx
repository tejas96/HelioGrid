import { Text } from '../../primitives/Text/Text';
import { useOwnWidth } from '../../primitives/use-own-width';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Banner } from '../Banner';
import { Block } from '../Block';
import { Button } from '../Button';
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
import { useRetryFocus } from './use-retry-focus';
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
  const { words, surface } = props;
  const [room, width] = useOwnWidth();
  const wide = width !== null && width >= CATALOG_WIDE_FROM;
  const focus = useRetryFocus(surface);

  if (surface === 'error') {
    return (
      <div className="hg-cat-items" ref={room}>
        <EmptyState
          glow={false}
          icon={<ShellGlyph name="alert-circle" size="xl" />}
          title={words.loadFailed}
          description={words.loadFailedBody}
          action={
            <Button variant="secondary" size="lg" onClick={focus.retrying(props.onRetry)}>
              {words.tryAgain}
            </Button>
          }
        />
      </div>
    );
  }

  const loading = surface === 'loading';
  return (
    <div className="hg-cat-items" ref={room} data-wide={wide ? 'true' : undefined}>
      {loading ? (
        <LoadingBars label={words.loadingRelease} bars={['row']} />
      ) : (
        <CatalogStripBar strip={props.strip} focusRef={focus.target} />
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
        <CatalogList {...props} wide={wide} />
      )}
    </div>
  );
}

/** The list, its pager or its growing foot, and the archived count's caption under it. */
function CatalogList(props: CatalogItemsProps & { wide: boolean }) {
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
    rowPending: (row: CatalogRow) => catalogRowPending(props.rowStates[row.id], words),
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
