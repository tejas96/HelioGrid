import type { ReactNode } from 'react';

/**
 * The DS type scale (docs/engineering/17 §4). `overline` is the 11px/700/uppercase/0.12em signature —
 * the one sanctioned appearance below the 12px floor. `mono` is body-sm in Geist Mono,
 * for figures and identifiers.
 */
export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body-lg'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'overline'
  | 'mono';

/**
 * Text colour roles. The semantic entries resolve to the `-text` partner tokens — the only
 * semantic colours allowed to set words (contrast floor, packages/theme colors).
 */
export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'inverse'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type TextAlign = 'start' | 'center' | 'end';

export interface TextProps {
  /** The words. Required — a Text with nothing to say is a layout bug, not a default. */
  children: ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  /**
   * BCP-47 tag, when THIS text is in a different language from the page around it. A screen reader
   * running in English speaks मराठी under English pronunciation rules, and the product's own
   * language picker names every language in its own words — so any list whose items are not all in
   * the page's language needs this. Omit it and the text inherits the document, which is right
   * everywhere else. Web: `lang`. Native: `accessibilityLanguage`.
   */
  lang?: string;
}
