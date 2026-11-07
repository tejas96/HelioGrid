import {
  CATALOG_SORTS,
  COMPONENT_KINDS,
  type ComponentKind,
  catalogFiltersOn,
} from '@heliogrid/domain';
import { useState } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { FacetChips, FiltersButton } from '../FilterBar';
import { FilterPanel } from '../FilterPanel';
import { LoadingBars } from '../LoadingBars';
import { Menu } from '../Menu';
import { SearchField } from '../SearchField';
import {
  catalogFilterDimensions,
  catalogFilterOf,
  catalogFilterValue,
  catalogKindChips,
  catalogKindsChosen,
} from './CatalogItems.logic';
import type { CatalogItemsProps } from './CatalogItems.types';

type ControlProps = Pick<
  CatalogItemsProps,
  | 'words'
  | 'query'
  | 'onQuery'
  | 'filter'
  | 'onFilter'
  | 'sort'
  | 'onSort'
  | 'schemes'
  | 'kindCounts'
> & {
  wide: boolean;
  /** The kinds scroll in one row, as a phone's do; else they wrap. */
  scrollKinds: boolean;
  /** The list's count, on the filter panel's footer. */
  resultCount: number;
  /** The kinds wait in their place while the page's read is out; the search keeps its words. */
  loadingKinds: boolean;
};

const _isKind = (value: string): value is ComponentKind =>
  (COMPONENT_KINDS as readonly string[]).includes(value);

/**
 * The search with its filter button — and at 1536 the sort switcher at the row's end — then the
 * kinds as glass chips (direction A): *All* first and held while none is chosen, one per kind with
 * its count, a scrolling row where the panel is narrow. The filter panel is one column of sections
 * at both widths.
 */
export function CatalogItemsControls(props: ControlProps) {
  const { words, filter, onFilter, sort, wide } = props;
  const chips = catalogKindChips(words, filter, props.kindCounts);
  const [filtering, setFiltering] = useState(false);
  return (
    <div className="hg-cat-controls">
      <div className="hg-cat-search-row">
        <span className="hg-cat-search">
          <SearchField
            placeholder={words.search}
            ariaLabel={words.searchLabel}
            value={props.query}
            onChange={props.onQuery}
            onClear={() => props.onQuery('')}
            clearLabel={words.clearSearch}
          />
        </span>
        <FiltersButton
          label={words.filters}
          activeLabel={words.filtersActive}
          count={catalogFiltersOn(filter)}
          onClick={() => setFiltering(true)}
        />
        {wide ? (
          <Menu
            label={words.sortLabel}
            selection="single"
            align="end"
            width={220}
            onSelect={(key) => {
              const next = CATALOG_SORTS.find((each) => each === key);
              if (next !== undefined) props.onSort(next);
            }}
            items={CATALOG_SORTS.map((each) => ({
              key: each,
              label: words.sorts[each],
              selected: each === sort,
            }))}
            trigger={
              <Button
                variant="secondary"
                size="md"
                icon={<ShellGlyph name="sort" size="sm" />}
                iconRight={<ShellGlyph name="caret-down" size="sm" />}
                spokenName={words.sortNamed(words.sorts[sort])}
              >
                {words.sorts[sort]}
              </Button>
            }
          />
        ) : null}
      </div>
      {props.loadingKinds ? (
        <LoadingBars label={words.loadingKinds} bars={['row']} />
      ) : (
        <FacetChips
          label={words.kindLabel}
          scroll={props.scrollKinds}
          selectedLabel={words.selectedKind}
          options={chips.options}
          values={chips.values}
          counts={chips.counts}
          onChange={(values) => onFilter(catalogKindsChosen(filter, values))}
        />
      )}
      <FilterPanel
        open={filtering}
        onClose={() => setFiltering(false)}
        /* The catalog's words carry no close of their own; the footer's *Done* names the same act. */
        closeLabel={words.closeFilters}
        words={words.filterPanel}
        dimensions={catalogFilterDimensions(words, props.schemes)}
        value={catalogFilterValue(filter)}
        onChange={(value) => onFilter(catalogFilterOf(value))}
        resultCount={props.resultCount}
        resultNoun={words.filterPanel.resultNoun}
        zIndex={60}
      />
    </div>
  );
}
