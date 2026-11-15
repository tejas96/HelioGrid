/** How wide a thumbnail's page is, as the design draws it. */
export const READER_THUMB_WIDTH = 104;

/**
 * The page in view of a column of pages: the one the reader's top edge falls in, from each page's
 * top edge in order. A reader above the first page reads page 0.
 */
export function pageInView(tops: readonly number[], scrollTop: number, lookAhead: number): number {
  let at = 0;
  for (const [index, top] of tops.entries()) {
    if (top - lookAhead <= scrollTop) at = index;
  }
  return at;
}

/** The room the thumbnail column and its gap take beside the pages, at the desktop's width. */
const READER_THUMBS_ROOM = 208;
/** The widest a page is drawn on a desk — its reading size — and the narrowest it is ever drawn. */
const READER_PAGE_MAX = 680;
const READER_PAGE_MIN = 280;

/**
 * How wide the reader draws a page in the room the caller measured: the room less the thumbnails
 * at the desktop's width, the whole room on a phone, never past the page's own reading size.
 */
export function readerPageWidth(room: number | null, wide: boolean): number {
  if (room === null) return READER_PAGE_MIN;
  const free = wide ? room - READER_THUMBS_ROOM : room;
  return Math.max(READER_PAGE_MIN, Math.min(READER_PAGE_MAX, Math.floor(free)));
}
