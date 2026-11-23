/**
 * The page of a PDF we lay (`T-M05-002d`, ruling 6): no question first. A page drawn in lines is a
 * plan when its lines outnumber its words, so a page of specifications in a table loses to a floor
 * plan; a page whose plan is a picture — a builder's brochure — is laid as a photo. A page that
 * names the roof or the terrace wins over a floor's, since the roof is what the studio draws.
 */

/** What a page holds, as the PDF reader counts it. */
export interface PdfPageCount {
  readonly page: number;
  /** Closed outlines, and lines longer than a thirtieth of the page's diagonal. */
  readonly closedLines: number;
  readonly longLines: number;
  readonly words: number;
  /** The share of the page the largest picture on it covers, 0 to 1. */
  readonly pictureShare: number;
  /** The page's words name the roof or the terrace; the page's words name a plan. */
  readonly namesRoof: boolean;
  readonly namesPlan: boolean;
}

export type PdfPagePick = { readonly page: number; readonly kind: 'lines' | 'picture' } | null;

/** A page with at least this many lines for each 50 words is drawn, not written. */
const LINES_PER_50_WORDS = 40;
const WORDS_PER_SCORE = 50;
/** A picture covering this share of a page or more is the page. */
const PICTURE_PAGE_SHARE = 0.3;

function lineScore(count: PdfPageCount): number {
  return (count.closedLines + count.longLines) / Math.max(1, count.words / WORDS_PER_SCORE);
}

/** The best of the pages that qualify: the roof's first, then the most of what `score` counts. */
function best(
  pages: readonly PdfPageCount[],
  score: (count: PdfPageCount) => number,
): PdfPageCount | undefined {
  return [...pages].sort(
    (a, b) => Number(b.namesRoof) - Number(a.namesRoof) || score(b) - score(a) || a.page - b.page,
  )[0];
}

/**
 * The page to lay, and whether it is drawn in lines or is a picture; `null` when no page is either
 * — the file is no plan, and it is refused with its reason.
 */
export function pdfPagePick(pages: readonly PdfPageCount[]): PdfPagePick {
  const pictures = pages.filter(
    (count) => count.pictureShare >= PICTURE_PAGE_SHARE && count.namesPlan,
  );
  const drawn = pages.filter(
    (count) => count.pictureShare < PICTURE_PAGE_SHARE && lineScore(count) >= LINES_PER_50_WORDS,
  );
  const line = best(drawn, lineScore);
  if (line !== undefined) return { page: line.page, kind: 'lines' };
  const picture = best(pictures, (count) => count.pictureShare);
  return picture === undefined ? null : { page: picture.page, kind: 'picture' };
}
