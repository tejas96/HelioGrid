import type { ReactNode } from 'react';

/** `sheet` = white paper, `page` = a live page on canvas, `band` = one band of either. */
export type PreviewSurface = 'sheet' | 'page' | 'band';

/**
 * The floor below which the subject's 11px body copy stops reading as type: 0.82 ≈ 9px ÷ 11px.
 * One declaration for both platforms. The earlier 0.62 could never fire at 375px — a 335–343px
 * frame against a 480px design scales to 0.698–0.715, ABOVE that floor, so nothing cropped and
 * document type rendered at 7.7–7.9px, the size the design system calls unacceptable.
 */
export const DEFAULT_MIN_SCALE = 0.82;

/** The subject's natural width when the caller states none. */
export const DEFAULT_DESIGN_WIDTH = 480;

interface PreviewFrameBase {
  /** Overline above the frame — "PROPOSAL COVER", "CUSTOMER LINK PAGE". */
  label?: string;
  /** The line under it. Naming the surface as customer-facing is the caption's job — keep it. */
  caption?: string;
  /** An extra line for an honest consequence the subject reported (a colour that can't carry text). */
  note?: string;
  /**
   * The line said when the subject is cropped to its readable size (*Showing the top left, at a size
   * you can read.*), from `packages/i18n`. Not in the design system's contract: its English sat in
   * the component; without it no line is drawn.
   */
  croppedLabel?: string;
  /** The subject's natural width in px. The frame scales from this. Default 480. */
  designWidth?: number;
  /** The subject's natural height, where it has one (an A4 sheet). Live pages leave it unset. */
  designHeight?: number;
  /**
   * Refuse to scale below this and crop instead. **Default 0.82 ≈ 9px ÷ 11px** — the scale at
   * which the subject's 11px body copy stops reading as type.
   */
  minScale?: number;
  /** Cap on rendered height. Omitted, a cropped subject is cut to the footprint a fitted sheet would have had. */
  maxHeight?: number;
  /** `sheet` = white paper, `page` = a live page on canvas, `band` = one band of either. */
  surface?: PreviewSurface;
  /** A control beside the caption — "Open full preview". Sits **outside** the non-interactive subject. */
  action?: ReactNode;
  /** The subject: the real component that draws the customer-facing output. */
  children?: ReactNode;
}

/**
 * Either the subject is drawn, or its values are still loading (`SCR-M01-18`'s *Loading*): the
 * frame keeps its footprint at its own scale — the subject lays out hidden, out of the reader's
 * reach — and draws a `--canvas-sunken` placeholder with the theme's shimmer there, a busy region
 * named by `loadingLabel`. **Never a white rectangle**: on paper that reads as an empty
 * letterhead. A busy region with no name tells a screen reader nothing, so loading carries one.
 */
export type PreviewFrameLoading =
  | { loading?: false; loadingLabel?: string }
  | {
      loading: true;
      /** The busy region's words while `loading` ("Loading the proposal cover"). */
      loadingLabel: string;
    };

export type PreviewFrameProps = PreviewFrameBase & PreviewFrameLoading;

export interface PreviewFrameGroupProps {
  children?: ReactNode;
  /** Own-width (never viewport) px below which the frames stack. Default 560. */
  stackBelow?: number;
  /** Gap between frames in px. Default 20. */
  gap?: number;
}
