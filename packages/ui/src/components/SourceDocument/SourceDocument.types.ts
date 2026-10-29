import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ImageWords } from '../Image/Image.types';

export interface SourceDocumentPage {
  url: string;
  /** Natural page size, used for the aspect ratio. Defaults to A4 portrait. */
  width?: number;
  height?: number;
  /** A page caption — "Page 2 · Electrical characteristics". */
  label?: TranslatedText;
}

export type SourceDocumentFit = 'width' | 'page';

/**
 * `loading` · `ready` · `unsupported` (this kind has no preview — neutral and permanent, **not** an
 * error) · `failed` (the fetch failed — warning, retry) · `empty`. `auto` reads `pages`.
 *
 * **Local by ruling, not by drift** (law 1): these are the states of **a file the user handed
 * over**, and the two that differ from `SurfaceState` are the reason — `unsupported` is *this kind
 * of file has no rendering*, which is `unavailable`'s idea about a **format** rather than about
 * content, and `failed` names the fetch that did not land. The surface hosting this still takes the
 * five.
 */
export type SourceDocumentState = 'auto' | 'loading' | 'ready' | 'unsupported' | 'failed' | 'empty';

/** What the frame actually shows — `auto` resolved against the pages it was handed. */
export type ResolvedDocumentState = Exclude<SourceDocumentState, 'auto'>;

/**
 * `@heliogrid/i18n`'s `sourceDocumentWords`: what the document draws and speaks of its own — its
 * frame's name, its loading name, a page's description, and the paging and fit controls.
 */
export interface SourceDocumentWords {
  /** The frame's name when the caller gives no `label` — "contract.pdf — source document". */
  readonly named: (name: string) => TranslatedText;
  /** The loading page's name — "Loading contract.pdf". */
  readonly loading: (name: string) => TranslatedText;
  /** A page with no caption of its own — "contract.pdf, page 2 of 9". */
  readonly pageOf: (name: string, page: number, count: number) => TranslatedText;
  readonly previousPage: TranslatedText;
  readonly nextPage: TranslatedText;
  readonly fitWidth: TranslatedText;
  readonly fitPage: TranslatedText;
  /** Each page's frame: what a page that did not load says (`@heliogrid/i18n`'s `imageWords`). */
  readonly image: ImageWords;
}

export interface SourceDocumentProps {
  /** The file as the user knows it — its own name, in mono, never renamed by the product. */
  name: string;
  /** Beside the name: "PDF · 2.4 MB · uploaded 12 Mar 2026". The caller's words. */
  meta?: TranslatedText;
  /** One entry per page, in document order. */
  pages?: SourceDocumentPage[];
  page?: number;
  onPageChange?: (page: number) => void;
  state?: SourceDocumentState;
  /** Reading-area height in px. `ReadAlongside` sets this for the stacked arrangement. */
  height?: number;
  fit?: SourceDocumentFit;
  onFitChange?: (fit: SourceDocumentFit) => void;
  /**
   * Opening the real file is available in **every state that can offer it** — `ready` puts it in
   * the header; `unsupported`, `empty` and `failed` put it in the panel, `failed` beside "Try
   * again", because the state where the preview is gone is the state that most needs the source. A
   * preview is never the only way to see a file.
   */
  originalUrl?: string;
  onOpenOriginal?: () => void;
  openLabel: TranslatedText;
  onRetry?: () => void;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  unsupportedTitle: TranslatedText;
  unsupportedMessage?: TranslatedText;
  failedTitle: TranslatedText;
  failedMessage?: TranslatedText;
  emptyTitle: TranslatedText;
  emptyMessage?: TranslatedText;
  /** The frame's name; without it, the file's name said as what it is. */
  label?: TranslatedText;
  density?: 'expressive' | 'functional';
  words: SourceDocumentWords;
}

export interface ReadAlongsideProps {
  /** The `SourceDocument`. */
  document: ReactNode;
  /** The form. */
  children?: ReactNode;
  /** Switch measured on **its own width**, never the viewport (law 4). */
  breakpoint?: number;
  documentWidth?: number | string;
  stackedHeight?: number;
  expandedHeight?: number;
  /** The stacked arrangement's toggle, closed and open. */
  expandLabel: TranslatedText;
  collapseLabel: TranslatedText;
  gap?: number;
  label?: TranslatedText;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface SourceDocumentHeaderProps {
  name: string;
  meta?: TranslatedText;
  resolved: ResolvedDocumentState;
  /** Zero-based; the reader is shown `pageNumber + 1`. */
  pageNumber: number;
  count: number;
  fit: SourceDocumentFit;
  onPage: (n: number) => void;
  onFit: (f: SourceDocumentFit) => void;
  originalUrl?: string;
  onOpenOriginal?: () => void;
  openLabel: TranslatedText;
  words: SourceDocumentWords;
}

export interface SourceDocumentBodyProps {
  resolved: ResolvedDocumentState;
  name: string;
  page: SourceDocumentPage | null;
  /** Zero-based; the reader is shown `pageNumber + 1`. */
  pageNumber: number;
  count: number;
  aspect: number;
  bodyHeight: number;
  fit: SourceDocumentFit;
  originalUrl?: string;
  onOpenOriginal?: () => void;
  openLabel: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  unsupportedTitle: TranslatedText;
  unsupportedMessage?: TranslatedText;
  failedTitle: TranslatedText;
  failedMessage?: TranslatedText;
  emptyTitle: TranslatedText;
  emptyMessage?: TranslatedText;
  words: SourceDocumentWords;
  /** The document's frame, which stays while a failed file reloads. */
  focusAfter: FocusAfter;
}
