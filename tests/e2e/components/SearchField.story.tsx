import { Button, FilterChips, type FocusHandle, SearchField } from '@heliogrid/ui';
import { useRef, useState } from 'react';

/**
 * A search, a chip row and two acts that send focus to them through their handles (D286); the second
 * chooses the first chip and focuses it in the same turn, as *Show all* does.
 */
export function FocusHandlesStory({
  find,
  status,
  options,
  toSearch,
  toChip,
}: {
  find: string;
  status: string;
  options: { value: string; label: string }[];
  toSearch: string;
  toChip: string;
}) {
  const search = useRef<FocusHandle>(null);
  const chips = useRef<FocusHandle>(null);
  /* Starts on a chip other than the first, so *Show all* must choose *All* and focus it in one turn. */
  const [chosen, choose] = useState(options[1]?.value ?? '');
  return (
    <div>
      <SearchField ref={search} value="" onChange={() => {}} placeholder={find} ariaLabel={find} />
      <FilterChips ref={chips} label={status} value={chosen} onChange={choose} options={options} />
      <Button variant="ghost" onClick={() => search.current?.focus()}>
        {toSearch}
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          choose(options[0]?.value ?? '');
          chips.current?.focus();
        }}
      >
        {toChip}
      </Button>
    </div>
  );
}
