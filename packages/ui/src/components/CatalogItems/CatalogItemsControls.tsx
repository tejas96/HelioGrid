import {
  CATALOG_SORTS,
  COMPONENT_KINDS,
  type ComponentKind,
  catalogFiltersOn,
  withKinds,
} from '@heliogrid/domain';
import { useState } from 'react';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { FacetChips, FiltersButton } from '../FilterBar';
import { FilterPanel } from '../FilterPanel';
import { LoadingBars } from '../LoadingBars';
import { Menu } from '../Menu';
import { SearchField } from '../SearchField';
import { catalogFilterDimensions, catalogFilterOf, catalogFilterValue } from './CatalogItems.logic';
import type { CatalogItemsProps } from './CatalogItems.types';

type ControlProps = Pick<
  CatalogItemsProps,
  'words' | 'query' | 'onQuery' | 'filter' | 'onFilter' | 'sort' | 'onSort' | 'schemes'
> & {
  wide: boolean;
  /** The list's count, on the filter panel's footer. */
  resultCount: number;
  /** The kinds wait in their place while the page's read is out; the search keeps its words. */
  loadingKinds: boolean;
};

const isKind = (value: string): value is ComponentKind =>
  (COMPONENT_KINDS as readonly string[]).includes(value);

/**
 * The search with its filter button — and at 1536 the sort switcher at the row's end — then the
 * kinds: the phone's facet chips, or *All* and one chip per kind at 1536, many at once and *All*
 * when none is chosen. The filter panel is one column of sections at both widths.
 */
export function CatalogItemsControls(props: ControlProps) {
  const { words, filter, onFilter, sort, wide } = props;
  const [filtering, setFiltering] = useState(false);
  const toggleKind = (kind: ComponentKind) =>
    onFilter(
      withKinds(
        filter,
        filter.kinds.includes(kind)
          ? filter.kinds.filter((each) => each !== kind)
          : [...filter.kinds, kind],
      ),
    );
  return (
    <div className="hg-cat-controls">
      <div className="hg-cat-search-row">
        <span className="hg-cat-search">
          <SearchField
            density="functional"
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
      ) : wide ? (
        <fieldset className="hg-cat-kinds" aria-label={words.kindLabel}>
          <Chip
            density="functional"
            active={filter.kinds.length === 0}
            onClick={() => onFilter(withKinds(filter, []))}
          >
            {words.allKinds}
          </Chip>
          {COMPONENT_KINDS.map((kind) => (
            <Chip
              key={kind}
              density="functional"
              active={filter.kinds.includes(kind)}
              onClick={() => toggleKind(kind)}
            >
              {words.kinds[kind]}
            </Chip>
          ))}
        </fieldset>
      ) : (
        <FacetChips
          label={words.kindLabel}
          scroll
          selectedLabel={words.selectedKind}
          values={[...filter.kinds]}
          onChange={(values) => onFilter(withKinds(filter, values.filter(isKind)))}
          options={COMPONENT_KINDS.map((kind) => ({ value: kind, label: words.kinds[kind] }))}
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
