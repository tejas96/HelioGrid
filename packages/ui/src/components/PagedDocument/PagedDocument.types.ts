/**
 * PagedDocument — the shared prop contract.
 *
 * PRINT SURFACE — web renders and prints it; RN has no paper. There is deliberately no
 * `PagedDocument.native.tsx`: `@page`, 96dpi sheet geometry, the measure-then-emit cut and
 * print scoping have no React Native equivalent, and a phone never produces the artefact.
 * This file still has to stay platform-neutral because both tsconfig projects compile it.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { DisclosureKind, DisclosureSpec } from '../Disclosure';
import type { RichTextMetrics } from '../RichText/RichText.types';
import type { SurfaceRead } from '../UnavailableNote';

export type Paper = 'a4' | 'letter';
export type PageOrientation = 'portrait' | 'landscape';
/** `MS9-04`'s audience variants of the same pages. */
export type DocumentAudience = 'customer' | 'internal';
export type SectionAudience = DocumentAudience | 'both';
export type DocumentRendering = 'paged' | 'web';

export interface PageMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageGeometry {
  paper: Paper;
  orientation: PageOrientation;
  /** "A4 · 210 × 297 mm" — printed in a drawing sheet's title block. */
  // biome-ignore lint/plugin/copy-prop-type: the paper's standard name and size, as the standard writes it
  label: string;
  width: number;
  height: number;
  margin: PageMargin;
  contentW: number;
  contentH: number;
  /** Content height less the running head and the foot — what the cut actually fills. */
  flowH: number;
}

export interface PageGeometryOptions {
  paper?: Paper;
  orientation?: PageOrientation;
  margin?: number | Partial<PageMargin>;
}

/** The chunk context `renderRows` is handed. `continued` is what repeats a caption and header. */
export interface DocumentRowContext {
  continued: boolean;
  first: boolean;
  last: boolean;
  from: number;
  to: number;
  count: number;
}

export interface DocumentSection<Row = unknown> {
  /** Stable id. Used by `disclosuresAfter`, by the cut and by the annotation band. */
  id: string;
  /**
   * The section's content. **Atomic**: it is measured whole and placed whole, which is how a
   * figure and its provenance label, an image and its caption, and a disclosure are guaranteed
   * not to break across a page (item 5). A section taller than one page keeps its own sheet and
   * is reported through `onCut`'s `oversized`.
   */
  content?: ReactNode;
  /**
   * **The one thing that must break** — a 40-line BOM (`SCR-M06-14`). Declare the rows and the
   * engine cuts *between* them.
   */
  rows?: Row[];
  /**
   * Renders one chunk of `rows`. `continued` is true on every page after the first, which is how
   * a table's **caption and header repeat on a continuation page** — the thing `DataTable.caption`
   * could not do, and done in **both** renderings rather than only in print's `table-header-group`.
   * `last` is true on the chunk that carries the total, so the total is rendered once, at the end.
   *
   * The engine reads per-row heights from the rendered chunk: mark rows `data-flow-row` (a row's
   * own note line is `data-flow-row-note` and rides with it) and the total `data-flow-foot`.
   * `DataTable` sets all three; `tbody tr` / `tfoot` are the fallback.
   */
  renderRows?: (chunk: Row[], ctx: DocumentRowContext) => ReactNode;
  /**
   * **The total never lands alone.** If the footer will not fit under the last chunk, rows are
   * pushed forward so it prints *with* them — never fewer than this many. Default 2.
   */
  keepWithLast?: number;
  /** Starts a fresh sheet — a drawing page, a terms page, an annexure. */
  startsPage?: boolean;
  /**
   * **Conditional pages** (`MS9-25`: the SLD page is *"offered only when a real SLD exists"*).
   * `false` drops the section **before** packing, so the numbering counts what remains and no page
   * renders empty.
   */
  when?: boolean;
  /** `both` (default) · `customer` · `internal` — `MS9-04`'s audience variants of the same pages. */
  audience?: SectionAudience;
  /**
   * `SCR-M06-13`'s details that *"save but **will not print**"*. A screen-only section renders in
   * the **annotation band beside the sheets**, never on one: content that vanishes on paper cannot
   * sit inside a sheet whose whole claim is that screen and paper are identical.
   */
  screenOnly?: boolean;
  /** The band's own overline — "Internal notes", "Costing workings". */
  label?: TranslatedText;
  /** Adds `data-keep-together` in the web rendering too. */
  keepTogether?: boolean;
}

export interface TitleBlockSpec {
  /**
   * **The customer-facing project name — never the internal design or variant name** (`MS9-01`).
   * Absent renders a named gap; it never falls back to the design's name.
   */
  projectName?: string;
  /** Rendered **only** under `audience="internal"`. A separate prop, so it cannot leak. */
  internalName?: string;
  customer?: { name: string; meta?: string };
  proposalNumber?: string;
  issueDate?: string | Date;
  /** Version / revision — "Rev C", "v3". */
  version?: string;
  /** The validity period's end. */
  validUntil?: string | Date;
  /** Prepared-by **with company identity**: `{company, lines, person, role}`. */
  preparedBy?: { company?: string; lines?: string[]; person?: string; role?: string };
  /** The overline — the document's kind. Omitted, the words' `docTitle` ("Solar proposal"). */
  docTitle?: TranslatedText;
}

/** The title block's own words, from `packages/i18n`'s `pagedDocumentWords(t).titleBlock`. */
export interface TitleBlockWords {
  /** The overline when the spec names no document — "Solar proposal". */
  docTitle: TranslatedText;
  /** The named gap where the customer-facing project name is not set yet. */
  noProjectName: TranslatedText;
  /** The internal variant's line — "Internal design name · {name}". */
  internalName: (name: string) => TranslatedText;
  /** "Prepared by {person}". */
  preparedBy: (person: string) => TranslatedText;
  /** The four fields' overlines. */
  proposalNumber: TranslatedText;
  issued: TranslatedText;
  revision: TranslatedText;
  validUntil: TranslatedText;
}

/** `MS9-01`'s title block. The customer-facing name is a different prop from the internal one. */
export interface TitleBlockProps extends TitleBlockSpec {
  audience?: DocumentAudience;
  words: TitleBlockWords;
}

/**
 * The words a paged document says of its own, from `packages/i18n`'s `pagedDocumentWords`: its
 * sheets' numbering and names, the internal marks, the annotation band, its states and its title
 * block's. The document's own `errorTitle` … `unavailableMessage` replace one state's words.
 */
export interface PagedDocumentWords {
  /** The foot's counted numbering — "Sheet 3 of 7". `numbering` replaces it. */
  sheetOf: (sheet: number, sheets: number) => TranslatedText;
  /** Each sheet's accessible name — "{document} · sheet 3 of 7". */
  sheetName: (document: string, sheet: number, sheets: number) => TranslatedText;
  /** The running head's mark on an internal sheet. */
  internalCopy: TranslatedText;
  /** The internal stamp — "Internal copy — not for the customer." */
  internalStamp: TranslatedText;
  /** An annotation's overline when its section names none. */
  internalNote: TranslatedText;
  /** An annotation's overline — "{note} · saved, not printed". */
  savedNotPrinted: (note: string) => TranslatedText;
  /** The pending cut's busy name — "Laying out the document". */
  layingOut: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage: TranslatedText;
  /** The failed read's *Try again*. */
  retry: TranslatedText;
  unavailableTitle: TranslatedText;
  titleBlock: TitleBlockWords;
}

/** One section's own span through the cut, 1-based, in the units the sheet foot prints. */
export interface DocumentSectionSpan {
  from: number;
  to: number;
  sheets: number;
}

export interface PagedDocumentCut {
  /** The WHOLE document's counted sheets. */
  sheets: number;
  rendering: DocumentRendering;
  geometry: PageGeometry;
  audience: string;
  /**
   * **Per-section spans, 1-based**, keyed by section id: `{from, to, sheets}`. This — not the
   * document total — is what a section's own `PageEstimate measured={…}` reads: a 3-page terms
   * section inside an 11-page proposal is 3, and `sheets` would have printed 11.
   */
  sections: Record<string, DocumentSectionSpan>;
  /** `sections[id].sheets`, or 0 for a section that was dropped or never placed. */
  pagesOf: (id: string) => number;
  oversized: string[];
}

export interface PagedDocumentProps<Row = unknown> {
  paper?: Paper;
  orientation?: PageOrientation;
  margin?: number | Partial<PageMargin>;
  /**
   * `paged` — real sheets at real paper size. `web` — **the same section list with the cut turned
   * off** (`F5-39`: *"the customer link always renders the proposal as web — PDF is an artifact,
   * never the only path to the number"*; `M06-51`: *"the link renders the same content as web"*).
   * Not a second authored document: one `sections` array, one order, one set of disclosures.
   */
  rendering?: DocumentRendering;
  /** `MS9-04`: **never internal by default** on a customer artefact. Internal stamps every sheet. */
  audience?: DocumentAudience;
  titleBlock?: TitleBlockSpec;
  sections?: DocumentSection<Row>[];
  /**
   * The mandatory lines. **A required flow atom, not a section** — there is no prop that hides it,
   * it cannot be marked `screenOnly`, and it renders in the reading flow at the weight of the
   * figures it qualifies. Presence is enforced too, not remembered: a document with
   * `audience="customer"` and no `disclosures` **warns in the console** (`M06-04`, P0).
   */
  disclosures?: (DisclosureKind | DisclosureSpec)[];
  /** Put them after this section id. Default: directly after the title block. */
  disclosuresAfter?: string;
  /** The letterhead's foot, on every sheet. */
  footNote?: ReactNode;
  /** The numbering words. Default the words' `sheetOf`. The **count is counted**, never passed in. */
  numbering?: (sheet: number, sheets: number) => TranslatedText;
  /** Accessible name for the document and its sheets — "Proposal"; the head without a title block. */
  label: TranslatedText;
  /**
   * Fires with the **counted** cut. This is the number a `PageEstimate` stops estimating with, and
   * the way a caller reads the page count without running a second layout pass.
   */
  onCut?: (info: PagedDocumentCut) => void;
  /** Required: what this draws always comes from a read, and a failed read carries its retry. */
  read: SurfaceRead;
  /** Every word the document says of its own; the four below replace one state's words. */
  words: PagedDocumentWords;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  unavailableTitle?: TranslatedText;
  /** Drawn under the unavailable title only when given — `words` holds no such message. */
  unavailableMessage?: TranslatedText;
}

export interface PrintScopeProps {
  only?: 'screen' | 'print' | 'both';
  children?: ReactNode;
}

export interface PageEstimateOptions extends PageGeometryOptions {
  /** The band's own column, when it is narrower than the page — a terms band inside a document. */
  contentWidth?: number;
  fontSize?: number;
  lineHeight?: number;
  /** Height taken by the surrounding document furniture. Defaults to the head + foot. */
  reserve?: number;
  advance?: number;
}

/**
 * The numbers an estimate rests on, so a reader can check it instead of trusting it. Facts, not
 * words: `PageEstimate` says them through its words' `basis`.
 */
export interface PageEstimateBasis {
  /** The paper's standard name and size — "A4 · 210 × 297 mm". */
  paper: string;
  /** The body size in points. */
  points: number;
  /** The column's width in px. */
  column: number;
  linesPerPage: number;
}

export interface PageEstimateResult {
  /** 0 at zero characters — the editor never prints "≈ 0 pages". */
  pages: number;
  lines: number;
  linesPerPage: number;
  charsPerLine: number;
  geometry: PageGeometry;
  basis: PageEstimateBasis;
}

/** `PageEstimate`'s words, from `packages/i18n`'s `pageEstimateWords`. */
export interface PageEstimateWords {
  /** A counted number — "3 pages". */
  pages: (count: number) => TranslatedText;
  /** An estimate — "≈ 3 pages". */
  aboutPages: (count: number) => TranslatedText;
  /** The cap, stated — "1 over the 3-page limit". */
  overLimit: (over: number, max: number) => TranslatedText;
  /** The basis, spoken — "A4 · 210 × 297 mm · 12pt · 698px column · 42 lines a page". */
  basis: (paper: string, points: number, column: number, linesPerPage: number) => TranslatedText;
}

export interface PageEstimateProps {
  words: PageEstimateWords;
  metrics?: RichTextMetrics;
  /** The counted number from `onCut`'s `pagesOf(sectionId)` — it drops the "≈". */
  measured?: number;
  /** The cap, stated in words: "≈ 4 pages · 1 over the 3-page limit". */
  max?: number;
  paper?: Paper;
  orientation?: PageOrientation;
  contentWidth?: number;
  fontSize?: number;
  lineHeight?: number;
  reserve?: number;
  advance?: number;
}
