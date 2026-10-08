import type { ReactNode } from 'react';

/**
 * The DS type scale (docs/engineering/17 §4). `overline` is the 11px/700/uppercase/0.12em signature —
 * the one sanctioned appearance below the 12px floor. `mono` is body-sm in Geist Mono,
 * for figures and identifiers. The three `field-` variants are a field's label, typed value and
 * helper or error line, at the design system's field sizes (`--fs-field-*`).
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
  | 'mono'
  | 'field-label'
  | 'field-value'
  | 'field-helper';

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
  /**
   * ANNOUNCE this text when it appears, rather than only describing it. For a refusal that happens
   * under the user's finger — a gate that jumps you to an already-failing field leaves it off,
   * because a screen reader that shouts every field on arrival tells you nothing.
   * Web: `role="alert"`. Native: `accessibilityLiveRegion="assertive"`.
   */
  live?: boolean;
  /**
   * Keep the words on ONE line, cut with an ellipsis at the end — for a NAME a bar has one line
   * for, like the company's in the phone's top bar (`SCR-SHELL-01`). Never translated copy: a
   * translation that fits in English clips in Hindi and Marathi (ui-adherence).
   * Web: `white-space: nowrap` with `text-overflow: ellipsis`. Native: `numberOfLines={1}`.
   */
  oneLine?: boolean;
  /** The variant at the bold weight — a name that must stand out in a line of its own size. */
  bold?: boolean;
  /**
   * Keep the words at their drawn size whatever text size the person set — only for a control, or
   * a bar's or a sheet's title, that the platforms' own versions never grow, like a tab bar's
   * label: grown, the footer's label pushed More off the screen (D83). Its name still reaches a
   * screen reader whole.
   * Native: `allowFontScaling={false}`. The web has no text size of its own to ignore.
   */
  fixedSize?: boolean;
}
