/**
 * DrawingSheet — the shared prop contract.
 *
 * PRINT SURFACE — web renders and prints it; RN has no paper. There is deliberately no
 * `DrawingSheet.native.tsx`: a drafting sheet is 96dpi paper geometry, an `@page` box and a title
 * block sized to A3/A4, none of which React Native has an equivalent for. This file still has to
 * stay platform-neutral because both tsconfig projects compile it.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { DisclosureSpec } from '../Disclosure';
import type { PageOrientation, Paper } from '../PagedDocument/PagedDocument.types';

export interface SheetSymbol {
  /** The drafting code — "PV", "INV", "ACDB". Mono, beside the mark. */
  code?: string;
  /** What the symbol stands for — "PV module". */
  label: TranslatedText;
  /** A node for a real symbol; otherwise a 12px mark in `mark`'s colour. */
  glyph?: ReactNode;
  mark?: string;
  shape?: 'square' | 'circle';
}

export interface DrawingTitleBlock {
  project?: string;
  /** What this sheet draws — "Roof layout". Printed under the project, or as the title without one. */
  drawingTitle?: TranslatedText;
  drawingNumber?: string;
  revision?: string;
  issueDate?: string | Date;
  drawnBy?: string;
  checkedBy?: string;
  client?: string;
}

/**
 * The words a drawing sheet says of its own, from `packages/i18n`'s `drawingSheetWords`: its
 * counted numbering and name, the empty slot's reservation, the north mark, the legend, the title
 * block's field names and the zoom controls' names.
 */
export interface DrawingSheetWords {
  /** The sheet's accessible name — "{drawing} · sheet 2 of 5". */
  sheetName: (drawing: string, sheet: number, sheets: number) => TranslatedText;
  /** The foot's counted numbering — "Sheet 2 of 5". */
  sheetOf: (sheet: number, sheets: number) => TranslatedText;
  /** The empty slot's reservation — "single-line diagram renders here". */
  rendersHere: (drawing: string) => TranslatedText;
  north: TranslatedText;
  legend: TranslatedText;
  /** The title block's overline: a named project's, else the drawing's. */
  project: TranslatedText;
  drawing: TranslatedText;
  /** The title block's field names. */
  drawingNumber: TranslatedText;
  revision: TranslatedText;
  scale: TranslatedText;
  paper: TranslatedText;
  issued: TranslatedText;
  drawnBy: TranslatedText;
  checked: TranslatedText;
  zoomIn: TranslatedText;
  zoomOut: TranslatedText;
}

/**
 * `MS8-02`: *"zoom either works or is not advertised."* The controls render **only** when
 * `onChange` is supplied, and they are screen-only.
 */
export interface DrawingSheetZoom {
  value?: number;
  levels?: number[];
  onChange: (v: number) => void;
}

export interface DrawingSheetProps {
  paper?: Paper;
  /** Landscape by default — a roof plan is wider than it is tall. */
  orientation?: PageOrientation;
  margin?: number;
  /** The drawn scale, in the title block **and** on the foot (`MS8-02`). */
  scale?: string;
  sheet?: number;
  sheets?: number;
  titleBlock?: DrawingTitleBlock;
  /**
   * **The slot left for the drawing.** The canvas — roof outline, array, strings, dimensions — is a
   * later round. An empty slot renders a **named reservation at the drawing's own footprint**, with
   * the scale and paper size, so the sheet does not reflow when the drawing arrives and an
   * unfinished sheet is not mistakable for a finished one.
   */
  drawing?: ReactNode;
  /**
   * What belongs in the slot — "Single-line diagram", "Roof layout". The reservation's words, and
   * the sheet's name and title wherever the title block names no drawing.
   */
  drawingLabel: TranslatedText;
  /**
   * `MS8-17`: *"the legend lists **only symbols the sheet actually renders**"* — enforced, not
   * remembered: this is read **only when `drawing` exists**, so an empty slot produces no legend.
   */
  symbols?: SheetSymbol[];
  /**
   * `MS8-08`: *"the structural disclaimer travels on **every** sheet."* This replaces the **words**
   * (a `Disclosure` spec), never the presence — there is no `disclaimer={false}`, and `null`
   * renders the structure line.
   */
  disclaimer?: DisclosureSpec | ReactNode;
  north?: boolean;
  zoom?: DrawingSheetZoom;
  words: DrawingSheetWords;
}

/**
 * **The set, and the reason `MS8-02`'s consistency is not a caller's discipline.** It counts its
 * children and hands each one the group's paper, orientation, scale, shared title-block fields and
 * travelling disclaimer, plus its own counted `sheet` against the group's total. No sheet states
 * its own total, so no two sheets can disagree about how many there are.
 */
export interface DrawingSheetGroupProps {
  children?: ReactNode;
  paper?: Paper;
  orientation?: PageOrientation;
  scale?: string;
  titleBlock?: DrawingTitleBlock;
  disclaimer?: DisclosureSpec | ReactNode;
  gap?: number | string;
}
