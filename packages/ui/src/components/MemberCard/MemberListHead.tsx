import { teamStatusFilterOf } from '@heliogrid/domain';
import { FilterChips } from '../FilterBar/FilterChips';
import { SearchField } from '../SearchField/SearchField';
import type { MemberListHeadProps } from './MemberCard.types';

/** A team list's held head on the web (`SCR-M01-12`): one line at the table's width, two below it. */
export function MemberListHead({
  query,
  onFind,
  status,
  onFilter,
  counts,
  words,
  wide = false,
  searchRef,
  chipsRef,
}: MemberListHeadProps) {
  return (
    <div className="hg-member-list-head" data-wide={wide ? 'true' : undefined}>
      <div className="hg-member-list-find">
        <SearchField
          ref={searchRef}
          value={query}
          onChange={onFind}
          onClear={query === '' ? undefined : () => onFind('')}
          clearLabel={words.clearSearch}
          placeholder={words.find}
          ariaLabel={words.find}
        />
      </div>
      <FilterChips
        ref={chipsRef}
        label={words.statusFilter}
        scroll={!wide}
        value={status}
        onChange={(value) => {
          const chosen = teamStatusFilterOf(value);
          if (chosen !== null) onFilter(chosen);
        }}
        counts={counts}
        options={words.statusOptions}
      />
    </div>
  );
}
