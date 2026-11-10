'use client';
import { SEARCH_FIELD, SHELL, SIDEBAR } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SearchField, ShellGlyph } from '@heliogrid/ui';
import { useSyncExternalStore } from 'react';

export interface ShellSearchProps {
  query: string;
  onQuery: (query: string) => void;
  onClear: () => void;
  onOpen: () => void;
}

/**
 * The one search (`F6-20`), in the sidebar: what is typed here opens the search over the page with
 * it, as Enter does, and Command K (Ctrl K off a Mac) opens it from anywhere — its keys shown
 * beside the field. The field's own clear empties the query; the browser's is hidden.
 */
export function ShellSearch({ query, onQuery, onClear, onOpen }: ShellSearchProps) {
  const t = useTranslate();
  const mac = useOnAMac();
  return (
    <form
      className="hg-shell-search"
      onSubmit={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      <SearchField
        placeholder={t(SIDEBAR.searchOrJump)}
        ariaLabel={t(SHELL.search)}
        value={query}
        onChange={onQuery}
        onClear={onClear}
        clearLabel={t(SEARCH_FIELD.clear)}
      />
      <span className="hg-shell-search-keys" aria-hidden="true">
        {mac ? <ShellGlyph name="command" size="sm" tone="secondary" /> : null}
        {t(mac ? SIDEBAR.jumpKeyMac : SIDEBAR.jumpKeys)}
      </span>
    </form>
  );
}

/** Whether this browser runs on a Mac; the server's first paint says no, and the browser corrects it. */
function useOnAMac(): boolean {
  return useSyncExternalStore(
    stays,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}

/** The browser a page runs in never changes under it, so nothing is ever told. */
function stays(): () => void {
  return () => {};
}
