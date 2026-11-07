'use client';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SearchField } from '@heliogrid/ui';

export interface ShellSearchProps {
  query: string;
  onQuery: (query: string) => void;
  onOpen: () => void;
}

/** The one search (`F6-20`), in the sidebar: Enter opens the search door with what is typed. */
export function ShellSearch({ query, onQuery, onOpen }: ShellSearchProps) {
  const t = useTranslate();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      <SearchField
        density="functional"
        placeholder={t(SHELL.searchPlaceholder)}
        ariaLabel={t(SHELL.search)}
        value={query}
        onChange={onQuery}
      />
    </form>
  );
}
