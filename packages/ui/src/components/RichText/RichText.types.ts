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

/**
 * Every word the editor itself says — seen or spoken. **Required, with no English default**: the
 * caller's catalog fills it, so a Hindi screen-reader user never hears an English toolbar.
 */
export interface RichTextWords {
  /** The toolbar's spoken name — "Formatting". */
  formatting: string;
  /** The five mark buttons' spoken names. */
  bold: string;
  italic: string;
  heading: string;
  bulletedList: string;
  numberedList: string;
  /** The link button's spoken name — "Link". */
  link: string;
  /** The link field's spoken name — "Link address". */
  linkAddress: string;
  /** The button that applies the link — "Add link". */
  addLink: string;
  /** The logo button's word while the logo is off — "Add logo". */
  addLogo: string;
  /** Its word while the logo is on — "Logo on". */
  logoOn: string;
  /** Its spoken name while off — "Add the logo". */
  addTheLogo: string;
  /** Its spoken name while on — "Remove the logo". */
  removeTheLogo: string;
  /** The placed logo's stand-in inside the editor — "Logo prints here". */
  logoPrintsHere: string;
  /** The web template select's empty choice — "Load template…". */
  loadTemplate: string;
  /** The web template select's spoken name — "Load a saved template". */
  loadSavedTemplate: string;
  /** The phone's spoken name of one saved template's button — "Load template: {name}". */
  loadTemplateNamed: (name: string) => string;
  /** The text box's spoken name when no `label` is shown — "Terms and conditions". */
  editorName: string;
  /** The footer count — "{count}/{max} characters", or "{count} characters" with no `max`. */
  characters: (count: number, max?: number) => string;
}

export interface RichTextProps {
  /** Every word the editor says — see `RichTextWords`. */
  words: RichTextWords;
  value?: RichTextValue;
  /** Live — fires per edit, which is what makes the character count real. */
  onChange?: (value: RichTextValue) => void;
  /** Once, on blur. The value a template save or a persist should read. */
  onCommit?: (value: RichTextValue) => void;
  label?: string;
  helper?: string;
  /** The hint while the body is empty. Omit and no hint shows. */
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
  /** The save button's words. The button shows only with both this and `onSaveAsTemplate`. */
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
  /** The placeholder slot's words while `logoSrc` is absent — the caller's, never a default. */
  logoLabel: string;
  /** Base size. 14 on screen, 11 inside a `DocumentPreview` sheet. Never below 12 on screen. */
  fontSize?: number;
  /** The ink — inside a `CustomerSurface` this is the tenant's contrast-gated colour. */
  color?: string;
  /** The quieter ink, for body copy and list items. */
  muted?: string;
  /** What to say when there is no content. Omit and nothing renders. */
  emptyText?: string;
}
