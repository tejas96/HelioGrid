import type { ReactNode } from 'react';
import type {
  RichTextBlock,
  RichTextListBlock,
  RichTextSpan,
  RichTextTextBlock,
  RichTextValue,
} from '../RichText/RichText.types';

/** The sheet's design width in px. Everything inside is drawn at this width and then scaled. */
export const DOCUMENT_DESIGN_WIDTH = 480;

/** A4's proportion — the sheet keeps it unless `fit="content"`. */
// biome-ignore lint/suspicious/noApproximativeNumericConstant: ISO 216's ratio IS √2, and the design system states it as 1.414. Math.SQRT2 would silently change the sheet height the design was drawn against.
export const A4_RATIO = 1.414;

/** The letterhead: the band's extra lines and the note along the foot of every page (`M01-50`). */
export interface DocumentLetterhead {
  /** One line under the company name — "Rooftop solar since 2011". */
  tagline?: string;
  /** Registration numbers, email, website. Printed as a single dot-separated line in the band. */
  lines?: string[];
  /** The line that runs along the bottom of every page. */
  footerNote?: string;
}

/** One entry of `SCR-M01-20`'s tranche schedule, as the customer will see it. */
export interface DocumentTranche {
  label: string;
  /** When it falls due — "On signing", "Before dispatch", "On commissioning". */
  when?: string;
  /** The share, already worded — "30%". */
  share?: string;
  amount: number | string;
}

/** One entry of `SCR-M01-19`'s included-sections list. A bare string is a label with no meta. */
export interface DocumentSection {
  label: string;
  /** `false` leaves the section out, as the print would. Defaults to included. */
  included?: boolean;
  meta?: string;
}

export type DocumentSectionInput = DocumentSection | string;

/** Which bands to draw, always in document order. */
export type DocumentPart = 'cover' | 'items' | 'sections' | 'tranches' | 'terms';

/** `[description, amount]`. Amounts are numbers; a string passes through untouched. */
export type DocumentLineItem = [string, number | string];

/**
 * The authored T&C body is `RichText`'s value — the SAME block list the editor writes and
 * `RichTextView` reads, not a document-local shape. It was re-declared here while `RichText` was
 * unported; the document-local names survive as aliases so a caller's import still resolves, but
 * there is only ONE declaration, and it is the editor's (`M06-51`).
 */
export type DocumentRichTextSpan = RichTextSpan;
/** A paragraph or a heading — one run list. */
export type DocumentRichTextRunBlock = RichTextTextBlock;
/** A bulleted or numbered list — a run list per item. */
export type DocumentRichTextListBlock = RichTextListBlock;
/** `p` paragraph · `h` heading · `ul`/`ol` lists · `logo` the inline logo placement. */
export type DocumentRichTextBlock = RichTextBlock;
/** A block list, not HTML — the same content type `SCR-M01-19`'s authored T&C body uses. */
export type DocumentRichTextValue = RichTextValue;

/** `a4` keeps the sheet's proportion. `content` hugs the bands drawn — a one-band preview. */
export type DocumentFit = 'a4' | 'content';

export interface DocumentPreviewProps {
  /** The tenant's primary brand colour, "#RRGGBB". */
  brandColor?: string;
  companyName?: string;
  /** Tenant logo. Without it, a labelled placeholder slot is drawn. */
  logoSrc?: string;
  logoLabel?: string;
  /** The tenant's tax number. */
  taxId?: string;
  /** What that number is called — defaults to the market pack ("GSTIN" here, "VAT number" elsewhere). */
  taxIdLabel?: string;
  address?: string;
  phone?: string;
  /**
   * **The letterhead** (`M01-50`) — a spec object, or a node for a caller that owns the markup.
   * The band and the foot are its authorable parts, so these are the props.
   */
  letterhead?: DocumentLetterhead | ReactNode;
  customerName?: string;
  customerMeta?: string;
  docTitle?: string;
  docNumber?: string;
  docDate?: string;
  /**
   * **Which bands to draw, always in document order.** Three settings screens each preview a
   * different piece of this one document, and each band drawn is the real one:
   *
   * - `SCR-M01-18` Branding → `["cover","items"]`
   * - `SCR-M01-19` Proposal template → `["cover","sections","terms"]`
   * - `SCR-M01-20` Payment terms → `["tranches"]` (with `fit="content"`)
   *
   * Without this, two of the three would have faked their preview with `[description, amount]`
   * line items — a schedule pretending to be a price list.
   */
  parts?: DocumentPart[];
  /**
   * `[description, amount]` pairs. Amounts are **numbers**, formatted by the active market pack
   * (`F1` / `F3-20`); a string passes through untouched for a caller that owns the text.
   */
  lineItems?: DocumentLineItem[];
  /**
   * **An assertion, not the printed figure.** The total printed is the **sum of `lineItems`**.
   * Pass this only to have it reconciled: a disagreement warns and the computed sum is what
   * prints (`SCR-M06-14` — a disagreement is a defect, not a display difference). Omit it in
   * normal use.
   */
  total?: number | string;
  /** Deducted under the total; the payable in the subsidy line is **computed**, never stated. */
  subsidyAmount?: number;
  subsidyLabel?: string;
  /** Overrides the whole generated subsidy sentence — including its computed payable. */
  subsidyNote?: string;
  /** `SCR-M01-19`'s included-sections list. `included: false` entries are left out. */
  sections?: DocumentSectionInput[];
  sectionsTitle?: string;
  /** `SCR-M01-19`'s default T&C body, rendered read-only so the document and the link page
   *  cannot render the same marks differently (`M06-51`). */
  terms?: DocumentRichTextValue;
  termsTitle?: string;
  /** `SCR-M01-20`'s tranche schedule. */
  tranches?: DocumentTranche[];
  tranchesTitle?: string;
  /** `a4` keeps the sheet's proportion (default). `content` hugs the bands drawn. */
  fit?: DocumentFit;
  /** Rendered width in px for standalone use. **Inside a `PreviewFrame`, the frame scales it.** */
  width?: number;
  /** Set to "" to drop the caption — do that inside a `PreviewFrame`, which carries its own. */
  caption?: string;
}
