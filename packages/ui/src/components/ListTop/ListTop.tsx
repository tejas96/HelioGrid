import { useState } from 'react';
import { FilterChips, FiltersButton } from '../FilterBar';
import { FilterPanel } from '../FilterPanel';
import { SearchField } from '../SearchField/SearchField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { ListSort } from './ListSort';
import { ListSummary } from './ListSummary';
import type { ListTopProps } from './ListTop.types';

/**
 * The top every list page shares, on the web. Narrow: the hero, whose list, the search with the
 * sort and filter circles, then the chips in one row that scrolls. Wide: the hero with the stages,
 * then whose list, the search, the named order and the filter in one toolbar, the chips under it.
 */
export function ListTop({ summary, scope, search, sort, filter, chips, room }: ListTopProps) {
  const [filtering, setFiltering] = useState(false);
  return (
    <div className="hg-list-top" data-room={room}>
      <ListSummary summary={summary} room={room} />
      <div className="hg-list-top-tools">
        {scope === null ? null : (
          <div className="hg-list-top-scope">
            <SegmentedControl {...scope} />
          </div>
        )}
        <div className="hg-list-top-search">
          <span className="hg-list-top-field">
            <SearchField {...search} />
          </span>
          <ListSort sort={sort} room={room} />
          <FiltersButton
            label={filter.label}
            activeLabel={filter.activeLabel}
            count={filter.on}
            onClick={() => setFiltering(true)}
          />
        </div>
      </div>
      <FilterChips {...chips} scroll />
      <FilterPanel
        open={filtering}
        onClose={() => setFiltering(false)}
        closeLabel={filter.closeLabel}
        words={filter.words}
        dimensions={filter.dimensions}
        value={filter.value}
        onChange={filter.onChange}
        onClear={filter.onClear}
        {...(filter.resultCount === null ? {} : { resultCount: filter.resultCount })}
        modal={room === 'narrow'}
        zIndex={60}
      />
    </div>
  );
}
