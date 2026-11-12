import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FiltersButton } from '../FilterBar/FilterBar.native';
import { FilterChips } from '../FilterBar/FilterChips.native';
import { FilterPanel } from '../FilterPanel/FilterPanel.native';
import { SearchField } from '../SearchField/SearchField.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { ListSort } from './ListSort.native';
import { ListSummary } from './ListSummary.native';
import type { ListTopProps } from './ListTop.types';

/**
 * The top every list page shares, on the phone: the hero, whose list, the search with the sort and
 * filter circles beside it, then the chips in one row that scrolls sideways.
 */
export function ListTop({ summary, scope, search, sort, filter, chips, room }: ListTopProps) {
  const [filtering, setFiltering] = useState(false);
  return (
    <View style={styles.top}>
      <ListSummary summary={summary} room={room} />
      {scope === null ? null : <SegmentedControl {...scope} />}
      <View style={styles.search}>
        <View style={styles.field}>
          <SearchField {...search} />
        </View>
        <ListSort sort={sort} room={room} />
        <FiltersButton
          label={filter.label}
          activeLabel={filter.activeLabel}
          count={filter.on}
          onClick={() => setFiltering(true)}
        />
      </View>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { gap: theme.spacing['sp-4'] },
  search: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  field: { flex: 1, minWidth: 0 },
});
