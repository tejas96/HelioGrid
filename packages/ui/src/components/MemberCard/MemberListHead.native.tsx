import { teamStatusFilterOf } from '@heliogrid/domain';
/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { FilterChips } from '../FilterBar/FilterChips.native';
import { SearchField } from '../SearchField/SearchField.native';
import type { MemberListHeadProps } from './MemberCard.types';

/**
 * A team list's held head on the phone (`SCR-M01-12`): the search, then the chips in one sideways row.
 * Its spacing is the held head's own (`ShellFrame`'s inner view), so it draws none.
 */
export function MemberListHead({
  query,
  onFind,
  status,
  onFilter,
  counts,
  words,
  searchRef,
  chipsRef,
}: MemberListHeadProps) {
  return (
    <>
      <SearchField
        ref={searchRef}
        value={query}
        onChange={onFind}
        onClear={query === '' ? undefined : () => onFind('')}
        clearLabel={words.clearSearch}
        placeholder={words.find}
        ariaLabel={words.find}
      />
      <FilterChips
        ref={chipsRef}
        label={words.statusFilter}
        scroll
        value={status}
        onChange={(value) => {
          const chosen = teamStatusFilterOf(value);
          if (chosen !== null) onFilter(chosen);
        }}
        counts={counts}
        options={words.statusOptions}
      />
    </>
  );
}
