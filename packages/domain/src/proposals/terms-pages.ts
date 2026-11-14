import type { RichTextBlock, RichTextSpan, RichTextValue } from '../commerce/rich-text';
import { PROPOSAL_LIMITS } from './vocabulary';

/**
 * How the terms flow over the document's pages (`M06-15`): at the paper's own text size, never
 * shrunk, block by block, a paragraph or list item that does not fit cut at a word and carried on
 * the next page. The builder's page estimate and every reader's pages are THIS computation, so the
 * estimate step 9 states is the number of terms pages that print.
 *
 * It measures by characters, not by drawing, so the phone, the web and the print page — which
 * cannot all measure a drawn line — agree on the same pages. The measures below are the terms
 * page's room on the 794 × 1123 sheet at 16 px over a 1.6 line, each set a little short of what
 * the page holds (Geist sets about 88 Latin or 100 Devanagari code units to the 666 px line, and
 * the body has 809 px under a one-line title), so a page planned here is never fuller than its
 * sheet. Raising one lets a planned page run past its foot.
 */
const TERMS_PAGE = {
  /** The body's height under the title, px — room for a title that wraps to two lines. */
  room: 760,
  /** One body line, px (16 px × 1.6, rounded up). */
  line: 26,
  /** Characters a body line holds. */
  charsPerLine: 76,
  /** Characters a list item's line holds, inside its indent. */
  charsPerItemLine: 72,
  /** Characters a heading's line holds: one step larger, and bold. */
  charsPerHeadingLine: 64,
  /** A heading's line, px (17 px × 1.6, rounded up). */
  headingLine: 28,
  /** The space above a heading that follows another block, and below every heading, px. */
  headingAbove: 16,
  headingBelow: 6,
  /** The space under a paragraph or a list, px. */
  gap: 11,
  /** A logo's row and the space under it, px — counted whether or not the company has a logo. */
  logo: 52,
  /**
   * How much of a Latin character's line one Devanagari code unit takes: its vowel signs and
   * viramas are code units of their own that take little or no width of their own.
   */
  devanagariShare: 0.85,
} as const;

const DEVANAGARI = /[\u0900-\u097F]/g;

/** A text's length in Latin characters' worth of line. */
function lineLength(text: string): number {
  const devanagari = text.match(DEVANAGARI)?.length ?? 0;
  return text.length - devanagari * (1 - TERMS_PAGE.devanagariShare);
}

/** One row the terms flow in: a heading, a paragraph, a list item or the logo. */
type Row =
  | { readonly kind: 'h' | 'p'; readonly spans: readonly RichTextSpan[] }
  | {
      readonly kind: 'li';
      readonly list: 'ul' | 'ol';
      /** Which list of the terms it belongs to, so a page's items fold back into their own list. */
      readonly listIndex: number;
      /** The number it prints, for an `ol`. */
      readonly number: number;
      readonly spans: readonly RichTextSpan[];
    }
  | { readonly kind: 'logo' };

const textOf = (spans: readonly RichTextSpan[]): string => spans.map((span) => span.text).join('');

function rowsOf(terms: RichTextValue): Row[] {
  const rows: Row[] = [];
  terms.blocks.forEach((block, listIndex) => {
    if (block.type === 'logo') rows.push({ kind: 'logo' });
    else if ('spans' in block) rows.push({ kind: block.type, spans: block.spans });
    else {
      const start = block.start ?? 1;
      block.items.forEach((spans, index) => {
        rows.push({ kind: 'li', list: block.type, listIndex, number: start + index, spans });
      });
    }
  });
  return rows;
}

function perLine(row: Row): number {
  if (row.kind === 'h') return TERMS_PAGE.charsPerHeadingLine;
  return row.kind === 'li' ? TERMS_PAGE.charsPerItemLine : TERMS_PAGE.charsPerLine;
}

/** A row's text lines: at least one, as an empty paragraph still takes its line. */
function linesOf(row: Row): number {
  if (row.kind === 'logo') return 0;
  return Math.max(1, Math.ceil(lineLength(textOf(row.spans)) / perLine(row)));
}

/** The px a row takes at a place on its page; `first` sits flush with the page's top. */
function heightOf(row: Row, first: boolean, lastOfList: boolean): number {
  switch (row.kind) {
    case 'logo':
      return TERMS_PAGE.logo;
    case 'h':
      return (
        (first ? 0 : TERMS_PAGE.headingAbove) +
        linesOf(row) * TERMS_PAGE.headingLine +
        TERMS_PAGE.headingBelow
      );
    case 'p':
      return linesOf(row) * TERMS_PAGE.line + TERMS_PAGE.gap;
    default:
      return linesOf(row) * TERMS_PAGE.line + (lastOfList ? TERMS_PAGE.gap : 0);
  }
}

/** The spans cut where the text reaches `at` characters, at the last space before it. */
function cutSpans(
  spans: readonly RichTextSpan[],
  at: number,
): readonly [RichTextSpan[], RichTextSpan[]] | null {
  const text = textOf(spans);
  const space = text.lastIndexOf(' ', at);
  if (space <= 0) return null;
  const head: RichTextSpan[] = [];
  const tail: RichTextSpan[] = [];
  let seen = 0;
  for (const span of spans) {
    const end = seen + span.text.length;
    if (end <= space) head.push(span);
    else if (seen > space) tail.push(span);
    else {
      const left = span.text.slice(0, space - seen);
      const right = span.text.slice(space - seen + 1);
      if (left !== '') head.push({ ...span, text: left });
      if (right !== '') tail.push({ ...span, text: right });
    }
    seen = end;
  }
  return [head, tail];
}

/** A row cut to the lines left on its page, else null: too little room to be worth a cut. */
function splitRow(row: Row, linesLeft: number): readonly [Row, Row] | null {
  if (row.kind === 'logo' || row.kind === 'h' || linesLeft < 2) return null;
  const cut = cutSpans(row.spans, linesLeft * perLine(row));
  if (cut === null) return null;
  const [head, tail] = cut;
  return [
    { ...row, spans: head },
    { ...row, spans: tail },
  ];
}

const isLastOfList = (rows: readonly Row[], index: number): boolean => {
  const row = rows[index];
  const next = rows[index + 1];
  return (
    row?.kind === 'li' &&
    (next === undefined || next.kind !== 'li' || next.listIndex !== row.listIndex)
  );
};

/** Rows packed into pages, a row too long for what is left of a page cut and carried on. */
function packed(all: readonly Row[]): Row[][] {
  const queue = [...all];
  const pages: Row[][] = [[]];
  let used = 0;
  for (let index = 0; index < queue.length; index += 1) {
    const row = queue[index] as Row;
    const page = pages.at(-1) as Row[];
    const first = page.length === 0;
    const height = heightOf(row, first, isLastOfList(queue, index));
    /* A heading keeps the line after it on its page. */
    const needs = row.kind === 'h' ? height + TERMS_PAGE.line : height;
    if (used + needs <= TERMS_PAGE.room) {
      page.push(row);
      used += height;
      continue;
    }
    const split = splitRow(
      row,
      Math.floor((TERMS_PAGE.room - used - TERMS_PAGE.gap) / TERMS_PAGE.line),
    );
    if (split !== null) {
      page.push(split[0]);
      queue.splice(index + 1, 0, split[1]);
    } else if (first) {
      /* Nothing smaller can be made of it: it takes its page whole. */
      page.push(row);
    } else {
      queue.splice(index + 1, 0, row);
    }
    pages.push([]);
    used = 0;
  }
  return pages;
}

/** A page's rows folded back into blocks; a list carried over keeps its numbering. */
function blocksOf(rows: readonly Row[]): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  let list: {
    listIndex: number;
    type: 'ul' | 'ol';
    start: number;
    items: RichTextSpan[][];
  } | null = null;
  const close = () => {
    if (list === null) return;
    blocks.push(
      list.type === 'ol' && list.start !== 1
        ? { type: 'ol', items: list.items, start: list.start }
        : { type: list.type, items: list.items },
    );
    list = null;
  };
  for (const row of rows) {
    if (row.kind !== 'li') {
      close();
      blocks.push(row.kind === 'logo' ? { type: 'logo' } : { type: row.kind, spans: row.spans });
      continue;
    }
    if (list === null || list.listIndex !== row.listIndex) {
      close();
      list = { listIndex: row.listIndex, type: row.list, start: row.number, items: [] };
    }
    list.items.push([...row.spans]);
  }
  close();
  return blocks;
}

const planned = new WeakMap<RichTextValue, readonly RichTextValue[]>();

/**
 * The terms as each page prints them, in order — at least one page, as the terms always print
 * (`T-M06-017`). A long text plans more than `PROPOSAL_LIMITS.termsPages`; the edit that would
 * save it is refused (`termsFitTheirPages`).
 */
export function termsPagesOf(terms: RichTextValue): readonly RichTextValue[] {
  const known = planned.get(terms);
  if (known !== undefined) return known;
  const pages = packed(rowsOf(terms)).map((rows) => ({
    version: 1 as const,
    blocks: blocksOf(rows),
  }));
  planned.set(terms, pages);
  return pages;
}

/** The characters the terms hold — every paragraph, heading and list item's words. */
export function termsChars(terms: RichTextValue): number {
  return rowsOf(terms).reduce(
    (sum, row) => sum + (row.kind === 'logo' ? 0 : textOf(row.spans).length),
    0,
  );
}

/** Step 9's count and page estimate (`M06-15`): the pages the document prints the terms on. */
export function termsEstimate(terms: RichTextValue): {
  readonly pages: number;
  readonly chars: number;
} {
  return { pages: termsPagesOf(terms).length, chars: termsChars(terms) };
}

/** Whether the terms print within their three pages (`M06-15`) — what an edit must hold. */
export function termsFitTheirPages(terms: RichTextValue): boolean {
  return termsPagesOf(terms).length <= PROPOSAL_LIMITS.termsPages;
}
