'use client';
import { SHELL, SIDEBAR } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type FocusHandle, SearchField, ShellGlyph } from '@heliogrid/ui';
import { useEffect, useRef, useSyncExternalStore } from 'react';

export interface ShellSearchProps {
  query: string;
  onQuery: (query: string) => void;
  onOpen: () => void;
}

/**
 * The one search (`F6-20`), in the sidebar: Enter opens the search door with what is typed, and
 * Command K (Ctrl K off a Mac) brings the field to hand from anywhere in the shell, its keys shown beside it.
 */
export function ShellSearch({ query, onQuery, onOpen }: ShellSearchProps) {
  const t = useTranslate();
  const field = useRef<FocusHandle>(null);
  const mac = useOnAMac();
  useEffect(() => {
    const bring = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      field.current?.focus();
    };
    document.addEventListener('keydown', bring);
    return () => document.removeEventListener('keydown', bring);
  }, []);
  return (
    <form
      className="hg-shell-search"
      onSubmit={(event) => {
        event.preventDefault();
        onOpen();
      }}
    >
      <SearchField
        ref={field}
        placeholder={t(SIDEBAR.searchOrJump)}
        ariaLabel={t(SHELL.search)}
        value={query}
        onChange={onQuery}
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
