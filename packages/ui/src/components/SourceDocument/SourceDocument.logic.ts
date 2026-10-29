import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { cloneElement, isValidElement } from 'react';
import type {
  ResolvedDocumentState,
  SourceDocumentBodyProps,
  SourceDocumentHeaderProps,
  SourceDocumentPage,
  SourceDocumentProps,
  SourceDocumentState,
  SourceDocumentWords,
} from './SourceDocument.types';

/* ISO 216's page ratio, as the design system writes it. Not Math.SQRT2. */
// biome-ignore lint/suspicious/noApproximativeNumericConstant: 1.414 is A4's stated ratio, not √2.
const A4 = 1 / 1.414;

/** The reading area's height when the caller names none, in px. */
export const DOCUMENT_HEIGHT = 480;

/**
 * `ReadAlongside`'s measures when the caller names none — one set, so both halves switch at the
 * same width and hold the document at the same heights.
 */
export const ALONGSIDE_DEFAULTS = {
  breakpoint: 720,
  documentWidth: '42%',
  stackedHeight: 300,
  expandedHeight: 560,
  gap: 20,
} as const;

/**
 * `auto` reads `pages`: none of them says so in words rather than drawing a blank rectangle. Every
 * other state is the caller's own claim about the file and is never second-guessed by a count.
 */
export function resolveDocumentState(
  state: SourceDocumentState,
  count: number,
): ResolvedDocumentState {
  return state === 'auto' ? (count === 0 ? 'empty' : 'ready') : state;
}

/**
 * The page on screen. The number is clamped into the document, so a caller keeping the page in a
 * URL cannot ask for a page that is not there — and a document with no pages has none.
 */
export function currentPage(pages: SourceDocumentPage[], page: number): SourceDocumentPage | null {
  return pages[Math.min(Math.max(page, 0), Math.max(pages.length - 1, 0))] ?? null;
}

/** The page's own shape, or A4 portrait when the caller did not measure it. */
export function pageAspect(page: SourceDocumentPage | null): number {
  return page?.width && page?.height ? page.width / page.height : A4;
}

/** The reading area: the caller's height less the chrome, never smaller than a readable page. */
export function readingHeight(height: number): number {
  return Math.max(180, height - 60);
}

/** The frame's name: the caller's `label`, else the file's name said as what it is. */
export function documentNameOf(
  label: TranslatedText | undefined,
  name: string,
  words: SourceDocumentWords,
): TranslatedText {
  return label || words.named(name);
}

export interface DocumentView {
  resolved: ResolvedDocumentState;
  page: SourceDocumentPage | null;
  aspect: number;
  bodyHeight: number;
  /** The page's caption under the reading area — only while a page is being read. */
  caption: TranslatedText | null;
}

/** Everything the frame shows, from the pages it was handed and the page the reader is on. */
export function documentViewOf(
  pages: SourceDocumentPage[],
  pageNumber: number,
  state: SourceDocumentState,
  height: number,
): DocumentView {
  const resolved = resolveDocumentState(state, pages.length);
  const page = currentPage(pages, pageNumber);
  return {
    resolved,
    page,
    aspect: pageAspect(page),
    bodyHeight: readingHeight(height),
    caption: resolved === 'ready' && page?.label ? page.label : null,
  };
}

/** Whether there is a way to the real file — a URL, or the caller's own handler. */
export function opensOriginal(
  originalUrl: string | undefined,
  onOpenOriginal: (() => void) | undefined,
): boolean {
  return Boolean(originalUrl || onOpenOriginal);
}

export interface DocumentHeaderView {
  /** Paging and fit controls exist only while a document with pages is being read. */
  paged: boolean;
  atFirst: boolean;
  atLast: boolean;
  /** The polite count between Previous and Next — "2 / 9". */
  position: string;
  showsOpen: boolean;
}

export function documentHeaderOf({
  resolved,
  pageNumber,
  count,
  originalUrl,
  onOpenOriginal,
}: SourceDocumentHeaderProps): DocumentHeaderView {
  return {
    paged: resolved === 'ready' && count > 0,
    atFirst: pageNumber <= 0,
    atLast: pageNumber >= count - 1,
    position: `${pageNumber + 1} / ${count}`,
    showsOpen: opensOriginal(originalUrl, onOpenOriginal) && resolved === 'ready',
  };
}

/** The page's footprint inside the reading area: its height less the padding, at the page's shape. */
export interface PageFootprint {
  width: number;
  height: number;
}

/**
 * What the reading area shows — the page, or the words that say why there isn't one. The order is
 * the rule: a loading or failed file is never read as empty, and an empty one never as a page.
 */
export type DocumentBodyView =
  | { kind: 'loading'; label: TranslatedText; footprint: PageFootprint }
  | { kind: 'unsupported' | 'empty'; title: TranslatedText; message: TranslatedText | undefined }
  | {
      kind: 'failed';
      title: TranslatedText;
      message: TranslatedText | undefined;
      /** Retry first (the likelier fix), the original beside it — when either can be offered. */
      hasActions: boolean;
    }
  | {
      kind: 'page';
      page: SourceDocumentPage;
      alt: TranslatedText;
      ratio: string;
      width: number | '100%';
    };

export function documentBodyOf(props: SourceDocumentBodyProps): DocumentBodyView {
  const { resolved, page, name, aspect, bodyHeight, words } = props;
  const footprintHeight = bodyHeight - 24;
  const footprint = { width: Math.round(footprintHeight * aspect), height: footprintHeight };
  if (resolved === 'loading') return { kind: 'loading', label: words.loading(name), footprint };
  if (resolved === 'unsupported') {
    return {
      kind: 'unsupported',
      title: props.unsupportedTitle,
      message: props.unsupportedMessage,
    };
  }
  if (resolved === 'failed') {
    const retrying = props.onRetry !== undefined && props.retryLabel !== undefined;
    return {
      kind: 'failed',
      title: props.failedTitle,
      message: props.failedMessage,
      hasActions: retrying || opensOriginal(props.originalUrl, props.onOpenOriginal),
    };
  }
  if (resolved === 'empty' || page === null) {
    return { kind: 'empty', title: props.emptyTitle, message: props.emptyMessage };
  }
  return {
    kind: 'page',
    page,
    alt: page.label || words.pageOf(name, props.pageNumber + 1, props.count),
    ratio: `${aspect}`,
    width: props.fit === 'page' ? footprint.width : '100%',
  };
}

/** The state panel's mark: a warning says so, every other state shows the file. */
export function messageGlyphOf(tone: 'warning' | undefined): 'alert-circle-up' | 'file-plain' {
  return tone === 'warning' ? 'alert-circle-up' : 'file-plain';
}

/** Side by side at or above the breakpoint of its OWN width — and before it has been measured. */
export function sitsAlongside(width: number | null, breakpoint: number): boolean {
  return width === null || width >= breakpoint;
}

/**
 * Stacked, the document takes a reading height — taller while expanded; side by side it keeps the
 * height its caller gave it.
 */
export function documentAtHeight(
  doc: ReactNode,
  {
    side,
    expanded,
    stackedHeight,
    expandedHeight,
  }: { side: boolean; expanded: boolean; stackedHeight: number; expandedHeight: number },
): ReactNode {
  return isValidElement<SourceDocumentProps>(doc) && !side
    ? cloneElement(doc, { height: expanded ? expandedHeight : stackedHeight })
    : doc;
}
