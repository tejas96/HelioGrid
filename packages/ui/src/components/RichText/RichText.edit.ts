import { isListBlock, isTextBlock } from './RichText.model';
import type { RichTextBlock, RichTextSpan, RichTextValue } from './RichText.types';

/**
 * Block-level edit operations on the value.
 *
 * The web half edits through `contenteditable` and a DOM serialiser, which is where inline
 * selections come from. Touch has no selection API a mark can be applied to, so the touch editor
 * works at BLOCK granularity: bold, italic and link apply to the block (or list item) that holds
 * the caret. The value model is unchanged, and everything these operations produce renders in
 * `RichTextView` — the mark set stays closed either way.
 */

/** Where the caret is: a block, and inside a list, which item. */
export interface RichTextAt {
  block: number;
  item?: number;
}

export type BlockMark = 'b' | 'i';

function withBlocks(blocks: RichTextBlock[]): RichTextValue {
  return { version: 1, blocks };
}

function replaceBlock(value: RichTextValue, index: number, block: RichTextBlock): RichTextValue {
  const blocks = value.blocks.slice();
  blocks[index] = block;
  return withBlocks(blocks);
}

/** The spans the caret sits in — a paragraph's, a heading's, or one list item's. */
export function spansAt(value: RichTextValue, at: RichTextAt): RichTextSpan[] {
  const b = value.blocks[at.block];
  if (b === undefined) return [];
  if (isListBlock(b)) return b.items[at.item ?? 0] ?? [];
  return isTextBlock(b) ? b.spans : [];
}

function putSpans(value: RichTextValue, at: RichTextAt, spans: RichTextSpan[]): RichTextValue {
  const b = value.blocks[at.block];
  if (b === undefined) return value;
  if (isListBlock(b)) {
    const items = b.items.slice();
    items[at.item ?? 0] = spans;
    return replaceBlock(value, at.block, { ...b, items });
  }
  if (!isTextBlock(b)) return value;
  return replaceBlock(value, at.block, { ...b, spans });
}

/** Typing rewrites the run's text and keeps the marks the run already carried. */
export function setTextAt(value: RichTextValue, at: RichTextAt, text: string): RichTextValue {
  const existing = spansAt(value, at)[0];
  const marks: Omit<RichTextSpan, 'text'> = {
    ...(existing?.b === true ? { b: true } : {}),
    ...(existing?.i === true ? { i: true } : {}),
    ...(existing?.href !== undefined ? { href: existing.href } : {}),
  };
  return putSpans(value, at, [{ text, ...marks }]);
}

export function toggleMarkAt(value: RichTextValue, at: RichTextAt, mark: BlockMark): RichTextValue {
  const spans = spansAt(value, at);
  const on = spans.length > 0 && spans.every((s) => s[mark] === true);
  const next = on ? undefined : true;
  return putSpans(
    value,
    at,
    spans.map((s) => (mark === 'b' ? { ...s, b: next } : { ...s, i: next })),
  );
}

/** An empty href clears the link — the same toggle the web toolbar's Link button performs. */
export function setHrefAt(value: RichTextValue, at: RichTextAt, href: string): RichTextValue {
  const spans = spansAt(value, at);
  return putSpans(
    value,
    at,
    spans.map((s) => ({ ...s, href: href === '' ? undefined : href })),
  );
}

/** Heading toggles a paragraph and back. A list item is left alone. */
export function toggleHeadingAt(value: RichTextValue, at: RichTextAt): RichTextValue {
  const b = value.blocks[at.block];
  if (b === undefined || !isTextBlock(b)) return value;
  return replaceBlock(value, at.block, { type: b.type === 'h' ? 'p' : 'h', spans: b.spans });
}

/** A paragraph becomes a one-item list; a list of that kind becomes paragraphs again. */
export function toggleListAt(
  value: RichTextValue,
  at: RichTextAt,
  kind: 'ul' | 'ol',
): RichTextValue {
  const b = value.blocks[at.block];
  if (b === undefined) return value;
  if (isListBlock(b)) {
    if (b.type !== kind) return replaceBlock(value, at.block, { ...b, type: kind });
    const paragraphs: RichTextBlock[] = b.items.map((spans) => ({ type: 'p', spans }));
    const blocks = value.blocks.slice();
    blocks.splice(at.block, 1, ...paragraphs);
    return withBlocks(blocks);
  }
  if (!isTextBlock(b)) return value;
  return replaceBlock(value, at.block, { type: kind, items: [b.spans] });
}

/** Enter: a new empty run after the caret — a sibling list item, or a new paragraph. */
export function insertAfter(value: RichTextValue, at: RichTextAt): RichTextValue {
  const b = value.blocks[at.block];
  if (b !== undefined && isListBlock(b)) {
    const items = b.items.slice();
    items.splice((at.item ?? 0) + 1, 0, [{ text: '' }]);
    return replaceBlock(value, at.block, { ...b, items });
  }
  const blocks = value.blocks.slice();
  blocks.splice(at.block + 1, 0, { type: 'p', spans: [{ text: '' }] });
  return withBlocks(blocks);
}

/** `M06-15`'s add-logo toggle, as a block at the top of the value. */
export function toggleLogoBlock(value: RichTextValue): RichTextValue {
  const hasLogo = value.blocks.some((b) => b.type === 'logo');
  if (hasLogo) return withBlocks(value.blocks.filter((b) => b.type !== 'logo'));
  return withBlocks([{ type: 'logo' }, ...value.blocks]);
}

/** Which toolbar buttons read as pressed for the block holding the caret. */
export function marksAt(value: RichTextValue, at: RichTextAt) {
  const b = value.blocks[at.block];
  const spans = spansAt(value, at);
  const all = (mark: BlockMark) => spans.length > 0 && spans.every((s) => s[mark] === true);
  return {
    bold: all('b'),
    italic: all('i'),
    h: b?.type === 'h',
    ul: b?.type === 'ul',
    ol: b?.type === 'ol',
  };
}
