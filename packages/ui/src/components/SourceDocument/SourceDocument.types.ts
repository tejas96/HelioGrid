import type { ReactNode } from 'react';

export interface SourceDocumentPage {
  url: string;
  /** Natural page size, used for the aspect ratio. Defaults to A4 portrait. */
  width?: number;
  height?: number;
  /** A page caption — "Page 2 · Electrical characteristics". */
  label?: string;
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

export interface SourceDocumentProps {
  /** The file as the user knows it — its own name, in mono, never renamed by the product. */
  name?: string;
  /** Beside the name: "PDF · 2.4 MB · uploaded 12 Mar 2026". The caller's words. */
  meta?: string;
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
  openLabel?: string;
  onRetry?: () => void;
  unsupportedTitle?: string;
  unsupportedMessage?: string;
  failedTitle?: string;
  failedMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  label?: string;
  density?: 'expressive' | 'functional';
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
  expandLabel?: string;
  collapseLabel?: string;
  gap?: number;
  label?: string;
}
