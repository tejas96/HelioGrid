'use client';
import type { SearchScreen } from '@heliogrid/data/react';
import { SEARCH_FIELD, type SearchWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Badge,
  type FocusHandle,
  Modal,
  SearchField,
  SearchResults,
  ShellGlyph,
} from '@heliogrid/ui';
import { type KeyboardEvent, useEffect, useRef } from 'react';
import { paletteKeyCaps } from '../constants';
import '../search.css';

/** Over the shell's own overlays: the bell's centre and its sheets sit under the search. */
const PALETTE_LAYER = 60;

interface SearchPaletteProps {
  screen: SearchScreen;
  words: SearchWords;
  /** Opens a result's record, or a group's See all, and the palette with it. */
  onOpen: (address: string) => void;
  onClose: () => void;
}

/**
 * The desktop's search (`SCR-SHELL-02`): a palette over the page, which blurs and fades behind it.
 * The field holds the keyboard — ↓ and ↑ walk the rows from the first, Enter opens the one the
 * cursor is on, Esc closes — while every row stays a link Tab reaches on its own. What is read,
 * drawn and reopened is `useSearchScreen`'s, the phone's too.
 */
export function SearchPalette({ screen, words, onOpen, onClose }: SearchPaletteProps) {
  const t = useTranslate();
  const body = useRef<HTMLDivElement>(null);
  const field = useRef<FocusHandle>(null);
  useEffect(() => field.current?.focus({ preventScroll: true }), []);
  /* The cursor's row stays in view as the keys walk past the list's edge. */
  useEffect(() => {
    if (screen.cursor === null) return;
    body.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [screen.cursor]);

  /* Only the field's own keys: Enter on a row's link or on Reopen is that control's. */
  const walk = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      screen.step(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && screen.cursorAddress !== null) {
      event.preventDefault();
      onOpen(screen.cursorAddress);
    }
  };

  return (
    <Modal
      size="wide"
      place="top"
      label={words.title}
      closeLabel={words.keys.close}
      showClose={false}
      onClose={onClose}
      zIndex={PALETTE_LAYER}
      footer={<PaletteKeys words={words} />}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the keys are the field's, caught as they bubble from it */}
      <div ref={body} className="hg-search-palette" onKeyDown={walk}>
        <div className="hg-search-palette-field">
          <SearchField
            ref={field}
            value={screen.query}
            onChange={screen.type}
            onClear={screen.clear}
            clearLabel={t(SEARCH_FIELD.clear)}
            placeholder={words.placeholder}
            ariaLabel={words.title}
          />
        </div>
        <SearchResults
          read={screen.read}
          searching={screen.searching}
          cursor={screen.cursor}
          onOpen={onOpen}
          onReopen={screen.reopen}
          words={words}
        />
      </div>
    </Modal>
  );
}

/** The keys the palette answers, and whose records it searches. */
function PaletteKeys({ words }: { words: SearchWords }) {
  return (
    <div className="hg-search-palette-foot">
      <span className="hg-search-palette-keys" aria-hidden="true">
        <span>
          <Badge tone="neutral" density="functional">
            <ShellGlyph name="chevron-up" size="sm" tone="secondary" />
          </Badge>
          <Badge tone="neutral" density="functional">
            <ShellGlyph name="chevron" size="sm" tone="secondary" />
          </Badge>
          {words.keys.move}
        </span>
        <span>
          <Badge tone="neutral" density="functional">
            {paletteKeyCaps.open}
          </Badge>
          {words.keys.open}
        </span>
        <span>
          <Badge tone="neutral" density="functional">
            {paletteKeyCaps.close}
          </Badge>
          {words.keys.close}
        </span>
      </span>
      <span>{words.onlyYours}</span>
    </div>
  );
}
