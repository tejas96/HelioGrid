import {
  COMPONENT_KINDS,
  type ComponentKind,
  catalogFiltersOn,
  withKinds,
} from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Block } from '../Block/Block.native';
import { Button } from '../Button/Button.native';
import { Badge, Chip } from '../Chip/Chip.native';
import { ChipGroup } from '../ChipGroup/ChipGroup.native';
import { DataTable } from '../DataTable/DataTable.native';
import type { DataTableColumn } from '../DataTable/DataTable.types';
import { Pagination } from '../DataTable/DataTableChrome.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FacetChips } from '../FilterBar/FacetChips.native';
import { FilterPanel } from '../FilterPanel/FilterPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { useFormat } from '../MarketProvider/market-context';
import { NamedGap } from '../NamedGap/NamedGap.native';
import { SearchField } from '../SearchField/SearchField.native';
import { catalogFilterDimensions, catalogFilterOf, catalogFilterValue } from './CatalogItems.logic';
import { catalogRowPending } from './CatalogItems.rows';
import type { CatalogItemsProps, CatalogPaging, CatalogRow } from './CatalogItems.types';
import { ListEntries } from './CatalogItemsFoot.native';
import { CatalogRowActs } from './CatalogRowActs';
import { CatalogStripBar } from './CatalogStrip';
import { useRetryFocus } from './use-retry-focus';

/** The placeholder cards while the list loads — the board's six. */
const LOADING_ROWS = ['panel', 'panel', 'panel', 'panel', 'panel', 'panel'] as const;

/**
 * Catalog settings' Items panel on the phone: the release strip, the view-only line or the
 * first-day card, the search with its filter sheet and the kind chips, then the resolved list as
 * cards. Every word is the caller's; the sheets a row opens are the app's.
 */
export function CatalogItems(props: CatalogItemsProps) {
  const { words, read, strip, query, onQuery, filter, onFilter, schemes } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dimensions = useMemo(() => catalogFilterDimensions(words, schemes), [words, schemes]);
  const focus = useRetryFocus(read.kind);

  if (read.kind === 'failed') {
    return (
      <EmptyState
        title={words.loadFailed}
        description={words.loadFailedBody}
        action={
          <Button variant="secondary" size="lg" onClick={focus.retrying(read.retry)}>
            {words.tryAgain}
          </Button>
        }
      />
    );
  }

  const loading = read.kind === 'loading';
  const kindOptions = COMPONENT_KINDS.map((kind) => ({ value: kind, label: words.kinds[kind] }));
  return (
    <View style={styles.panel}>
      {loading ? (
        <LoadingBars label={words.loadingRelease} bars={['row']} />
      ) : (
        <CatalogStripBar strip={strip} focusRef={focus.target} />
      )}
      {loading || props.viewOnly === null ? null : (
        <Banner kind="info" density="functional" title={props.viewOnly} />
      )}
      {loading || props.teaching === null ? null : (
        <Block
          overline={words.makeItYours}
          density="functional"
          read={{ kind: 'empty' }}
          emptyMessage={props.teaching}
        />
      )}
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder={words.search}
        ariaLabel={words.searchLabel}
        density="functional"
        onFilterClick={() => setFiltersOpen(true)}
        filterCount={catalogFiltersOn(filter)}
        filterLabel={words.filters}
      />
      {loading ? (
        <LoadingBars label={words.loadingKinds} bars={['row']} />
      ) : (
        <FacetChips
          label={words.kindLabel}
          scroll
          options={kindOptions}
          values={[...filter.kinds]}
          onChange={(kinds) => onFilter(withKinds(filter, kinds as ComponentKind[]))}
        />
      )}
      {loading ? <LoadingList props={props} /> : <ItemList props={props} />}
      <FilterPanel
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        closeLabel={words.closeFilters}
        dimensions={dimensions}
        value={catalogFilterValue(filter)}
        onChange={(value) => onFilter(catalogFilterOf(value))}
        words={words.filterPanel}
        resultCount={props.paging.rowCount}
        resultNoun={words.filterPanel.resultNoun}
      />
    </View>
  );
}

/** The list's region name over the six placeholder cards; the fixed words stay. */
function LoadingList({ props }: { props: CatalogItemsProps }) {
  return (
    <View style={styles.list}>
      <Text variant="overline" color="secondary" style={styles.region}>
        {props.words.region}
      </Text>
      <LoadingBars label={props.words.loadingList} bars={LOADING_ROWS} />
    </View>
  );
}

/** The resolved list as cards, its foot caption and the way to more rows. */
function ItemList({ props }: { props: CatalogItemsProps }) {
  const { words, administers, rowStates } = props;
  const columns = useItemColumns(props);
  const table = {
    read: props.read,
    columns,
    rows: [...props.rows],
    rowKey: 'id' as const,
    stackBelow: STACK_ALWAYS,
    density: 'compact' as const,
    caption: words.region,
    summary: words.summary,
    rowLabel: (row: CatalogRow) => row.labels.row,
    isRowMuted: (row: CatalogRow) => row.archived,
    isRowHighlighted: (row: CatalogRow) => row.id === props.addedId,
    rowPending: (row: CatalogRow) => catalogRowPending(rowStates[row.id], words),
    onRowClick: administers ? props.onOpen : undefined,
  };
  return (
    <View style={styles.list}>
      {administers ? (
        <DataTable<CatalogRow>
          {...table}
          rowActions={(row) => <CatalogRowActs row={row} stacked acts={props} />}
          actionsLabel={words.actions}
        />
      ) : (
        <DataTable<CatalogRow> {...table} />
      )}
      <Paging paging={props.paging} props={props} />
      {props.archivedCaption === null ? null : (
        <Text variant="caption" color="secondary" align="center">
          {props.archivedCaption}
        </Text>
      )}
      <ListEntries onAdd={props.onAdd} onImport={props.onImport} words={words} />
    </View>
  );
}

/** The phone's list is always cards: the board stacks below a width no phone reaches. */
const STACK_ALWAYS = 4000;

function useItemColumns(props: CatalogItemsProps): DataTableColumn<CatalogRow>[] {
  const { words, schemes } = props;
  const format = useFormat();
  return [
    { key: 'name', label: words.item, primary: true, strong: true },
    {
      key: 'spec',
      label: words.whatItIs,
      secondary: true,
      render: (row) => (
        <View style={styles.spec}>
          <Text variant="caption" color="secondary">
            {row.specLine}
          </Text>
          <Marks row={row} props={props} schemes={schemes} />
        </View>
      ),
    },
    {
      key: 'amount',
      label: words.effectivePrice,
      trailing: true,
      numeric: true,
      gap: (row) => (row.amount === null ? words.noPrice : null),
      render: (row) =>
        typeof row.amount === 'string' ? (
          <Text variant="mono" bold>
            {format.money(row.amount)}
          </Text>
        ) : null,
    },
  ];
}

/** The mark line: layer, preference, picker state, spec label and the schemes held — or their gap. */
function Marks({
  row,
  props,
  schemes,
}: {
  row: CatalogRow;
  props: CatalogItemsProps;
  schemes: readonly string[];
}) {
  const { words } = props;
  const schemeMarks =
    schemes.length === 0
      ? []
      : row.held.length === 0
        ? [<NamedGap key="gap" scale="cell" gap={words.noSchemeFlag} />]
        : row.held.map((scheme) => (
            <Badge key={scheme} tone="success" density="functional">
              {scheme}
            </Badge>
          ));
  return (
    <ChipGroup max={0} label={words.marks} density="functional">
      <Chip density="functional">{row.layerWord}</Chip>
      {row.preferred ? (
        <Badge tone="accent" density="functional">
          {words.preferred}
        </Badge>
      ) : null}
      {row.hidden ? (
        <Badge tone="warning" density="functional">
          {words.hiddenFromPickers}
        </Badge>
      ) : null}
      {row.provenance === 'representative' ? (
        <Badge tone="warning" density="functional">
          {row.provenanceWord}
        </Badge>
      ) : (
        <Chip density="functional">{row.provenanceWord}</Chip>
      )}
      {schemeMarks}
    </ChipGroup>
  );
}

/** A numbered page with the caller's pager words, or the growing list's next rows. */
function Paging({ paging, props }: { paging: CatalogPaging; props: CatalogItemsProps }) {
  const { words } = props;
  if (paging.kind === 'pages') {
    return (
      <Pagination
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
  if (!paging.hasMore) return null;
  return (
    <View style={styles.more}>
      <Button variant="secondary" size="sm" loading={paging.loadingMore} onClick={paging.onMore}>
        {words.loadMore}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: theme.spacing['sp-3'] },
  list: { gap: theme.spacing['sp-2'] },
  region: { paddingTop: theme.spacing['sp-3'], paddingHorizontal: theme.spacing['sp-4'] },
  spec: { gap: theme.spacing['sp-2'], marginTop: theme.spacing['sp-1'] },
  more: { alignItems: 'center' },
});
