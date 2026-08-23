import type {
  RichTextBlock,
  RichTextListBlock,
  RichTextMetrics,
  RichTextRow,
  RichTextSpan,
  RichTextTextBlock,
  RichTextValue,
} from './RichText.types';

export const EMPTY_RICH_TEXT: RichTextValue = { version: 1, blocks: [] };

export const textOf = (spans: RichTextSpan[] = []): string => spans.map((s) => s.text).join('');

/* The block union groups `p`/`h` and `ul`/`ol` behind one member each, exactly as the design
   system declares it, so a `type ===` test cannot discriminate it. These two guards do. */
export const isListBlock = (b: RichTextBlock): b is RichTextListBlock =>
  b.type === 'ul' || b.type === 'ol';

export const isTextBlock = (b: RichTextBlock): b is RichTextTextBlock =>
  b.type === 'p' || b.type === 'h';

/** The text a block holds, whatever its shape. */
function blockText(block: RichTextBlock): string {
  if (isListBlock(block)) return block.items.map(textOf).join(' ');
  if (isTextBlock(block)) return textOf(block.spans);
  return '';
}

/** Metrics from the **value**, never the DOM: what a paged surface reads to compute pages. */
export function measure(value?: RichTextValue): RichTextMetrics {
  const blocks = value?.blocks ?? [];
  let chars = 0;
  let listItems = 0;
  let headings = 0;
  let hasLogo = false;
  for (const b of blocks) {
    if (b.type === 'logo') {
      hasLogo = true;
      continue;
    }
    if (isListBlock(b)) {
      for (const item of b.items) {
        chars += textOf(item).length;
        listItems += 1;
      }
      continue;
    }
    if (isTextBlock(b)) {
      chars += textOf(b.spans).length;
      if (b.type === 'h') headings += 1;
    }
  }
  const words = blocks.reduce((n, b) => {
    const t = blockText(b).trim();
    return n + (t === '' ? 0 : t.split(/\s+/).length);
  }, 0);
  return { chars, words, blocks: blocks.length, headings, listItems, hasLogo };
}

/**
 * **The value as flow rows** — one row per paragraph, heading-with-its-block, or list ITEM.
 *
 * The items are the rows, never the list: a 30-item list that could only break as a whole would be
 * one page-tall atom. `start` rides along so a continued `ol` keeps its numbering.
 */
export function richTextRows(value?: RichTextValue): RichTextRow[] {
  const blocks = value?.blocks ?? [];
  const rows: RichTextRow[] = [];
  let carry: RichTextBlock[] | null = null;
  const push = (b: RichTextBlock) => {
    if (carry !== null) {
      rows.push({ blocks: [...carry, b] });
      carry = null;
      return;
    }
    rows.push({ blocks: [b] });
  };
  for (const b of blocks) {
    if (b.type === 'h') {
      if (carry !== null) rows.push({ blocks: carry });
      carry = [b];
      continue;
    }
    if (isListBlock(b)) {
      const kind = b.type;
      b.items.forEach((items, j) => {
        push(
          kind === 'ol'
            ? { type: 'ol', items: [items], start: j + 1 }
            : { type: 'ul', items: [items] },
        );
      });
      continue;
    }
    push(b);
  }
  if (carry !== null) rows.push({ blocks: carry });
  return rows;
}

/** Adjacent list rows fold back into one list when a chunk renders, numbering intact. */
export function foldRows(rows: RichTextRow[] = []): RichTextBlock[] {
  const out: RichTextBlock[] = [];
  for (const row of rows) {
    for (const b of row.blocks) {
      const prev = out[out.length - 1];
      if (prev !== undefined && isListBlock(b) && isListBlock(prev) && prev.type === b.type) {
        out[out.length - 1] = { ...prev, items: [...prev.items, ...b.items] };
        continue;
      }
      out.push({ ...b });
    }
  }
  return out;
}

/**
 * Positional render keys for a list with no ids of its own — a block list is authored, not
 * fetched, so there is nothing else to key on. Computed here rather than inline so both
 * renderers key the same way.
 */
export function keyed<T>(list: T[], prefix: string): Array<{ key: string; item: T }> {
  return list.map((item, i) => ({ key: `${prefix}-${i}`, item }));
}
