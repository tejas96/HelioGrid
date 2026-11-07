import { catalogFiltersOn } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import { Banner } from '../Banner/Banner.native';
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
import { Pagination } from '../DataTable/DataTableChrome.native';
import { EmptyState } from '../EmptyState/EmptyState.native';
import { FacetChips } from '../FilterBar/FacetChips.native';
import { FilterPanel } from '../FilterPanel/FilterPanel.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { LottieMoment } from '../LottieMoment/LottieMoment.native';
import { SearchField } from '../SearchField/SearchField.native';
import { CatalogItemList } from './CatalogItemList.native';
import {
  catalogFilterDimensions,
  catalogFilterOf,
  catalogFilterValue,
  catalogKindChips,
  catalogKindsChosen,
} from './CatalogItems.logic';
import type { CatalogItemsProps, CatalogPaging } from './CatalogItems.types';
import { ListEntries } from './CatalogItemsFoot.native';
import { CatalogStripBar } from './CatalogStrip.native';

/** The placeholder cards while the list loads — the board's six. */
const LOADING_ROWS = ['panel', 'panel', 'panel', 'panel', 'panel', 'panel'] as const;

/**
 * Catalog settings' Items panel on the phone (direction A): the release hero, the view-only line or
 * the first-day card, the search with its filter sheet and the kind chips — *All* first — then the
 * resolved list as one glass card of rows. Every word is the caller's; the sheets a row opens are
 * the app's.
 */
export function CatalogItems(props: CatalogItemsProps) {
  const { words, read, strip, query, onQuery, filter, onFilter, schemes } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dimensions = useMemo(() => catalogFilterDimensions(words, schemes), [words, schemes]);
  /* *Try again* leaves with the failure: the screen reader goes to the panel, which stays while it
     reloads. A dismissed row's line hands it to the strip's title, which stays. */
  const panel = useRef<View>(null);
  const stripTitle = useRef<View>(null);

  if (read.kind === 'failed') {
    return (
      <View ref={panel} style={styles.panel}>
        <EmptyState
          title={words.loadFailed}
          description={words.loadFailedBody}
          action={
            <RetryButton size="lg" onRetry={read.retry} label={words.tryAgain} focusAfter={panel} />
          }
        />
      </View>
    );
  }

  const loading = read.kind === 'loading';
  const chips = catalogKindChips(words, filter, props.kindCounts);
  return (
    <View ref={panel} style={styles.panel}>
      {loading ? (
        <LoadingBars label={words.loadingRelease} bars={['row']} />
      ) : (
        <CatalogStripBar strip={strip} focusRef={stripTitle} />
      )}
      {loading || props.viewOnly === null ? null : (
        <Banner kind="info" density="functional" title={props.viewOnly} />
      )}
      {loading || props.teaching === null ? null : (
        <View style={styles.teach} accessible>
          <LottieMoment name="empty-catalog" size={72} />
          <View style={styles.teachWords}>
            <Text variant="overline" color="secondary">
              {words.makeItYours}
            </Text>
            <Text variant="body" color="secondary">
              {props.teaching}
            </Text>
          </View>
        </View>
      )}
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder={words.search}
        ariaLabel={words.searchLabel}
        onFilterClick={() => setFiltersOpen(true)}
        filterCount={catalogFiltersOn(filter)}
        filterLabel={words.filters}
        filterActiveLabel={words.filtersActive}
      />
      {loading ? (
        <LoadingBars label={words.loadingKinds} bars={['row']} />
      ) : (
        <FacetChips
          label={words.kindLabel}
          scroll
          options={chips.options}
          counts={chips.counts}
          values={chips.values}
          selectedLabel={words.selectedKind}
          onChange={(values) => onFilter(catalogKindsChosen(filter, values))}
        />
      )}
      {loading ? <LoadingList props={props} /> : <ItemList props={props} focusAfter={stripTitle} />}
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

/** The resolved list as one glass card of rows, its pager, its foot caption and the entries. */
function ItemList({ props, focusAfter }: { props: CatalogItemsProps; focusAfter: FocusAfter }) {
  const { words } = props;
  return (
    <CatalogItemList
      props={props}
      focusAfter={focusAfter}
      foot={
        <>
          <Paging paging={props.paging} props={props} />
          {props.archivedCaption === null ? null : (
            <Text variant="caption" color="secondary" align="center">
              {props.archivedCaption}
            </Text>
          )}
          <ListEntries onAdd={props.onAdd} onImport={props.onImport} words={words} />
        </>
      }
    />
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
  more: { alignItems: 'center' },
  /* The first-day card is a tile: Ground's look, its moment beside the words. */
  teach: {
    ...tileSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-4'],
    paddingVertical: theme.spacing['sp-4'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-tile'],
  },
  teachWords: { flex: 1, gap: theme.spacing['sp-1'] },
});
