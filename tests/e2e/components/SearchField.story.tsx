import type { TranslatedText } from '@heliogrid/contracts';
import { createTranslator, filterBarWords } from '@heliogrid/i18n';
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
  find: TranslatedText;
  status: TranslatedText;
  options: { value: string; label: TranslatedText }[];
  toSearch: TranslatedText;
  toChip: TranslatedText;
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

const en = await createTranslator('en');
const bar = filterBarWords(en.t);

/**
 * The search pill with its filter square, the square's name bound in the browser: `filterActiveLabel`
 * is a function the field calls while it renders, so it cannot be handed to `mount`.
 */
export function FilterSquareStory({ label, count }: { label: TranslatedText; count: number }) {
  return (
    <SearchField
      ariaLabel={label}
      placeholder={label}
      onFilterClick={() => {}}
      filterCount={count}
      filterLabel={bar.filters}
      filterActiveLabel={bar.filtersActive}
    />
  );
}
