import type { ReactNode } from 'react';

/**
 * One inline run. `b` bold, `i` italic, `href` link — **the whole inline mark set**. Nothing else is
 * representable, which is what guarantees every mark has a read-only rendering.
 */
export interface RichTextSpan {
  text: string;
  b?: boolean;
  i?: boolean;
  href?: string;
}

/** `p` paragraph · `h` heading · `ul`/`ol` lists · `logo` the inline logo placement. */
export type RichTextBlock =
  | { type: 'p' | 'h'; spans: RichTextSpan[] }
  | { type: 'ul' | 'ol'; items: RichTextSpan[][]; start?: number }
  | { type: 'logo' };

/** A paragraph or a heading — the two blocks that hold one run of spans. */
export type RichTextTextBlock = Extract<RichTextBlock, { spans: RichTextSpan[] }>;

/** A bulleted or numbered list — the two blocks that hold a list of runs. */
export type RichTextListBlock = Extract<RichTextBlock, { items: RichTextSpan[][] }>;

/**
 * **A block list, not HTML.** It round-trips into the tenant's template set (`M01-51`) and is the
 * same content type `SCR-M01-19`'s authored T&C body uses, rather than being local to the proposal
 * builder. HTML would carry whatever the browser felt like emitting.
 */
export interface RichTextValue {
  version: 1;
  blocks: RichTextBlock[];
}

export interface RichTextMetrics {
  chars: number;
  words: number;
  blocks: number;
  headings: number;
  listItems: number;
  hasLogo: boolean;
}

/** One flow row: a paragraph, a heading with the block under it, or a single list item. */
export interface RichTextRow {
  blocks: RichTextBlock[];
}

/** One saved body in the tenant's template set (`M01-51`). */
export interface RichTextTemplate {
  id: string;
  name: string;
}

export interface RichTextProps {
  value?: RichTextValue;
  /** Live — fires per edit, which is what makes the character count real. */
  onChange?: (value: RichTextValue) => void;
  /** Once, on blur. The value a template save or a persist should read. */
  onCommit?: (value: RichTextValue) => void;
  label?: string;
  helper?: string;
  /** Default "Type the terms your customer will read." */
  placeholder?: string;
  /** Editor height floor. Design at the cap: `M06-15` allows three pages, not a two-line box. */
  minHeight?: number;
  /**
   * Hard character stop. **Not a pagination budget** and it never pretends to be one — see
   * `pageEstimate`.
   */
  maxLength?: number;
  disabled?: boolean;
  /** `M06-15`'s add-logo toggle. Reflected in the value as a `logo` block; `onLogoChange` reports it. */
  logo?: boolean;
  onLogoChange?: (on: boolean, value: RichTextValue) => void;
  logoSrc?: string;
  /** The tenant's template set (`M01-51`) — the round trip in and out. */
  templates?: RichTextTemplate[];
  onLoadTemplate?: (id: string) => void;
  onSaveAsTemplate?: (value: RichTextValue, metrics: RichTextMetrics) => void;
  /** Default "Save as template". */
  saveTemplateLabel?: string;
  /**
   * **The seam left for `M06-15`'s "≈ PDF page estimate".** Supplied by the caller, rendered in the
   * footer beside the character count, and **nothing** when empty — the editor never prints "≈ 1
   * page" it cannot stand behind. What fills it is `PageEstimate`, fed by `RichText.measure(value)`
   * and computed against `PagedDocument`'s own `PAGE_GEOMETRY`, so the editor's estimate and the
   * document's pages cannot come from two different ideas of a page.
   */
  pageEstimate?: ReactNode;
  /** Called with fresh metrics after every edit — the input side of the same seam. */
  onMeasure?: (metrics: RichTextMetrics) => void;
}

export interface RichTextViewProps {
  value?: RichTextValue;
  /** Fills a `logo` block. Without it, the block draws a labelled placeholder slot. */
  logoSrc?: string;
  /** Default "tenant logo". */
  logoLabel?: string;
  /** Base size. 14 on screen, 11 inside a `DocumentPreview` sheet. Never below 12 on screen. */
  fontSize?: number;
  /** The ink — inside a `CustomerSurface` this is the tenant's contrast-gated colour. */
  color?: string;
  /** The quieter ink, for body copy and list items. */
  muted?: string;
  /** What to say when there is no content. Omit and nothing renders. */
  emptyText?: string;
}
