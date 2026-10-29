/**
 * `SourceDocument`'s own words (`packages/ui`'s `SourceDocumentWords`): the frame's name, its
 * loading name, a page's description, the paging and fit controls — authored once, in three
 * languages (`F3-07`). `SOURCE_DOCUMENT` holds the words the document and `ReadAlongside` said
 * before a caller named its own.
 */
import type { Translator } from '../runtime';
import { CATALOG_SETTINGS } from './catalog-settings';

export const SOURCE_DOCUMENT = {
  openLabel: /*i18n*/ { id: 'Open original' },
  unsupportedTitle: /*i18n*/ { id: 'No preview for this file kind' },
  unsupportedMessage: /*i18n*/ { id: 'Open the original to read it.' },
  failedTitle: /*i18n*/ { id: "Couldn't load this document" },
  failedMessage: /*i18n*/ {
    id: "The file didn't load. Try again — if it keeps failing, upload it once more.",
  },
  emptyTitle: /*i18n*/ { id: 'Nothing to show yet' },
  emptyMessage: /*i18n*/ { id: 'This file has no readable pages.' },
  expandLabel: /*i18n*/ { id: 'Expand document' },
  collapseLabel: /*i18n*/ { id: 'Collapse document' },
} as const;

const WORDS = {
  named: /*i18n*/ { id: '{name} — source document' },
  loading: /*i18n*/ { id: 'Loading {name}' },
  pageOf: /*i18n*/ { id: '{name}, page {page} of {count}' },
  fitWidth: /*i18n*/ { id: 'Fit width' },
  fitPage: /*i18n*/ { id: 'Fit whole page' },
} as const;

/**
 * Every word `SourceDocument` draws or speaks of its own, in the reader's language — with its
 * pages' frame words, `imageWords(t)`, handed in.
 */
export function sourceDocumentWords<ImageWords>(t: Translator['t'], image: ImageWords) {
  return {
    named: (name: string) => t(WORDS.named, { name }),
    loading: (name: string) => t(WORDS.loading, { name }),
    pageOf: (name: string, page: number, count: number) => t(WORDS.pageOf, { name, page, count }),
    previousPage: t(CATALOG_SETTINGS.previousPage),
    nextPage: t(CATALOG_SETTINGS.nextPage),
    fitWidth: t(WORDS.fitWidth),
    fitPage: t(WORDS.fitPage),
    image,
  };
}
