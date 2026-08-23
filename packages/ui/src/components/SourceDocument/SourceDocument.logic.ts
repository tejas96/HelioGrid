import type { SourceDocumentPage, SourceDocumentState } from './SourceDocument.types';

/* ISO 216's page ratio, as the design system writes it. Not Math.SQRT2. */
// biome-ignore lint/suspicious/noApproximativeNumericConstant: 1.414 is A4's stated ratio, not √2.
const A4 = 1 / 1.414;

/** What the frame actually shows — `auto` resolved against the pages it was handed. */
export type ResolvedDocumentState = Exclude<SourceDocumentState, 'auto'>;

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
