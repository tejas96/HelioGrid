'use client';
import { useSearchScreen } from '@heliogrid/data/react';
import { SEARCH_FIELD, searchWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { LargeTitle, SearchField, SearchResults, useFormat } from '@heliogrid/ui';
import { useInstantMove } from '../../lib/instant-move';
import './search.css';

/**
 * Search as a page (`SCR-SHELL-02`): what the top bar's search opens below the desktop width, where
 * the palette has no room — the phone screen's twin, the field focused on arrival and the results
 * under it. Everything read, drawn and reopened is `useSearchScreen`'s.
 */
export function SearchScreen() {
  const t = useTranslate();
  const screen = useSearchScreen({ pack: useFormat().pack });
  const move = useInstantMove();
  const words = searchWords(t);
  return (
    <div className="hg-shell-page hg-search-page">
      <LargeTitle title={words.title} />
      <SearchField
        autoFocus
        value={screen.query}
        onChange={screen.type}
        onClear={screen.clear}
        clearLabel={t(SEARCH_FIELD.clear)}
        placeholder={words.placeholder}
        ariaLabel={words.title}
      />
      <SearchResults
        read={screen.read}
        searching={screen.searching}
        cursor={null}
        onOpen={(address) => move(`/${address}`)}
        onReopen={screen.reopen}
        words={words}
      />
    </div>
  );
}
