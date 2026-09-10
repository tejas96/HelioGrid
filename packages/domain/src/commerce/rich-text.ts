/**
 * The one document-content shape a tenant authors and a document renders (`M01-51`, `M06-15`,
 * `M06-51`): a block list, never HTML, so the proposal document and the customer link page cannot
 * render the same marks differently. The design system's `RichText` editor and `RichTextView`
 * renderer read exactly this; contracts mirrors it on the wire.
 */
export interface RichTextSpan {
  readonly text: string;
  readonly b?: boolean;
  readonly i?: boolean;
  readonly href?: string;
}

export type RichTextBlock =
  | { readonly type: 'p' | 'h'; readonly spans: readonly RichTextSpan[] }
  | {
      readonly type: 'ul' | 'ol';
      readonly items: readonly (readonly RichTextSpan[])[];
      readonly start?: number;
    }
  | { readonly type: 'logo' };

export interface RichTextValue {
  readonly version: 1;
  readonly blocks: readonly RichTextBlock[];
}

/** Plain paragraphs as a value — how a platform default is authored without an editor. */
export function richTextParagraphs(paragraphs: readonly string[]): RichTextValue {
  return {
    version: 1,
    blocks: paragraphs.map((text) => ({ type: 'p', spans: [{ text }] })),
  };
}
