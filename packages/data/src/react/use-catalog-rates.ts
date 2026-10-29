'use client';
import type { PriceBookActiveWire } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { type PriceBookBrowse, usePriceBook, usePriceBookBrowse } from './use-price-book';
import { type PriceBookDraft, usePriceBookDraft } from './use-price-book-draft';

/**
 * The Rates panel (`SCR-M01-15`, `M01-48`) as both screens draw it, assembled once (Law 11,
 * `F7-30`): the price book's version in force, the versions read-only, and a new version written
 * whole.
 */
export interface CatalogRates {
  readonly book: Read<PriceBookActiveWire>;
  /** The rate card in force once read: the newest version, or the platform default before the first. */
  readonly inForce: PriceBookActiveWire | undefined;
  readonly draft: PriceBookDraft;
  readonly versions: PriceBookBrowse;
  /** The number the version being written takes. */
  readonly next: number;
  /** Starts a new version as a copy of the one in force; nothing before the book is read. */
  start(): void;
  /** The first version, offered to a person who administers while none is in force. */
  readonly addFirst: (() => void) | null;
  /** Sends the new version; once it is in force `onPublished` hears its number. */
  publish(): Promise<void>;
}

/**
 * Fills `CatalogRates`. Mounted only while *Rates* is shown. `onPublished` says the new version is
 * in force in the screen's words.
 */
export function useCatalogRates(
  administers: boolean,
  onPublished: (number: number) => void,
): CatalogRates {
  const book = usePriceBook();
  const draft = usePriceBookDraft();
  const versions = usePriceBookBrowse();
  const inForce = book.kind === 'ready' ? book.value : undefined;
  const start = () => {
    if (inForce !== undefined) draft.start(inForce);
  };
  return {
    book,
    inForce,
    draft,
    versions,
    next: (draft.from ?? 0) + 1,
    start,
    addFirst: administers && (inForce?.version ?? null) === null ? start : null,
    publish: async () => {
      const number = await draft.publish();
      if (number !== null) onPublished(number);
    },
  };
}
