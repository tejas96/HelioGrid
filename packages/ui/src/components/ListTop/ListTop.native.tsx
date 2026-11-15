import { theme } from '@heliogrid/theme';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FiltersButton } from '../FilterBar/FilterBar.native';
import { FilterChips } from '../FilterBar/FilterChips.native';
import { FilterPanel } from '../FilterPanel/FilterPanel.native';
import { SearchField } from '../SearchField/SearchField.native';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.native';
import { ListSummary } from './ListSummary.native';
import { filterWithSortOf } from './ListTop.logic';
import type { ListTopProps } from './ListTop.types';

/**
 * The top every list page shares, on the phone: the hero, the search with the filter circle beside
 * it — the order is the filter sheet's first choice — the outlined chips in one row that scrolls
 * sideways, then whose list as a small switch (before the search in the wide room).
 */
export function ListTop({ summary, scope, search, sort, filter, chips, room }: ListTopProps) {
  const [filtering, setFiltering] = useState(false);
  const body = filterWithSortOf(filter, sort);
  return (
    <View style={styles.top}>
      <ListSummary summary={summary} room={room} />
      {scope === null || room === 'narrow' ? null : <SegmentedControl {...scope} />}
      <View style={styles.search}>
        <View style={styles.field}>
          <SearchField {...search} />
        </View>
        <FiltersButton
          label={filter.label}
          activeLabel={filter.activeLabel}
          count={filter.on}
          onClick={() => setFiltering(true)}
        />
      </View>
      <FilterChips {...chips} scroll look="outlined" />
      {scope === null || room === 'wide' ? null : (
        <View style={styles.scope}>
          <SegmentedControl {...scope} />
        </View>
      )}
      <FilterPanel
        open={filtering}
        onClose={() => setFiltering(false)}
        closeLabel={filter.closeLabel}
        words={filter.words}
        dimensions={body.dimensions}
        value={body.value}
        onChange={body.onChange}
        onClear={body.onClear}
        {...(filter.resultCount === null ? {} : { resultCount: filter.resultCount })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { gap: theme.spacing['sp-4'] },
  search: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  field: { flex: 1, minWidth: 0 },
  /* Whose list, under the chips in the narrow room: a small switch at the row's start. */
  scope: { alignSelf: 'flex-start', minWidth: '45%' },
});
