import { isListBlock } from './RichText.model';
import type { RichTextBlock, RichTextSpan, RichTextValue } from './RichText.types';

/**
 * The web half's DOM ↔ value bridge, and the place the mark whitelist is ENFORCED.
 *
 * Anything not named here is dropped, deliberately: a paste from Word cannot smuggle a colour, a
 * font or a table into a customer's document, and every mark that survives has a defined rendering
 * in `RichTextView`.
 */

/** The logo block's editor rendering — `contenteditable="false"`, so it is placed, not typed. */
export const LOGO_HTML =
  '<figure data-rt-logo="1" contenteditable="false" class="hg-rich-text-logo">' +
  '<span class="hg-rich-text-logo-chip"></span>Logo prints here</figure>';

type Marks = Omit<RichTextSpan, 'text'>;

const HEADINGS = ['H1', 'H2', 'H3', 'H4'];

/** The inline whitelist: bold · italic · link. Every other element contributes nothing but text. */
function marksFor(el: Element, marks: Marks): Marks {
  const next: Marks = { ...marks };
  if (el.tagName === 'B' || el.tagName === 'STRONG') next.b = true;
  if (el.tagName === 'I' || el.tagName === 'EM') next.i = true;
  const href = el.tagName === 'A' ? el.getAttribute('href') : null;
  if (href !== null) next.href = href;
  return next;
}

function walkInline(n: Node, marks: Marks, out: RichTextSpan[]): void {
  if (n.nodeType === Node.TEXT_NODE) {
    if (n.nodeValue !== null && n.nodeValue !== '') out.push({ text: n.nodeValue, ...marks });
    return;
  }
  if (n.nodeType !== Node.ELEMENT_NODE) return;
  const el = n as Element;
  if (el.tagName === 'BR') {
    out.push({ text: '\n', ...marks });
    return;
  }
  const next = marksFor(el, marks);
  for (const c of Array.from(el.childNodes)) walkInline(c, next, out);
}

function spansFrom(node: Node): RichTextSpan[] {
  const out: RichTextSpan[] = [];
  for (const c of Array.from(node.childNodes)) walkInline(c, {}, out);
  return out.filter((s) => s.text !== '');
}

/** One element as one block. Anything the whitelist does not name becomes a paragraph. */
function blockFrom(el: Element): RichTextBlock | null {
  if (el.hasAttribute('data-rt-logo')) return { type: 'logo' };
  if (el.tagName === 'UL' || el.tagName === 'OL') {
    const items = Array.from(el.querySelectorAll(':scope > li')).map((li) => spansFrom(li));
    return items.length === 0 ? null : { type: el.tagName === 'UL' ? 'ul' : 'ol', items };
  }
  if (HEADINGS.includes(el.tagName)) return { type: 'h', spans: spansFrom(el) };
  return { type: 'p', spans: spansFrom(el) };
}

/** The contenteditable subtree as a block list. */
export function serialise(root: HTMLElement): RichTextValue {
  const blocks: RichTextBlock[] = [];
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.nodeValue;
      if (raw !== null && raw.trim() !== '') blocks.push({ type: 'p', spans: [{ text: raw }] });
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const block = blockFrom(node as Element);
    if (block !== null) blocks.push(block);
  }
  return { version: 1, blocks };
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function spansToHtml(spans: RichTextSpan[] = []): string {
  if (spans.length === 0) return '<br>';
  return spans
    .map((s) => {
      let h = esc(s.text).replace(/\n/g, '<br>');
      if (s.b === true) h = `<b>${h}</b>`;
      if (s.i === true) h = `<i>${h}</i>`;
      if (s.href !== undefined) h = `<a href="${esc(s.href)}">${h}</a>`;
      return h;
    })
    .join('');
}

/** The value as editor HTML — the only writer of the contenteditable's innerHTML. */
export function toHtml(value?: RichTextValue): string {
  const blocks = value?.blocks ?? [];
  if (blocks.length === 0) return '<p><br></p>';
  return blocks
    .map((b) => {
      if (b.type === 'logo') return LOGO_HTML;
      if (isListBlock(b)) {
        return `<${b.type}>${b.items.map((it) => `<li>${spansToHtml(it)}</li>`).join('')}</${b.type}>`;
      }
      if (b.type === 'h') return `<h3>${spansToHtml(b.spans)}</h3>`;
      return `<p>${spansToHtml(b.spans)}</p>`;
    })
    .join('');
}
