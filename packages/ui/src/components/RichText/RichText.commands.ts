import type { ShellGlyphName } from '../AppShell/AppShell.types';

/**
 * The closed mark set, once, for both toolbars: bold · italic · heading · bulleted list ·
 * numbered list (+ link and the inline logo, which are their own buttons).
 *
 * Every command here has a defined read-only rendering in `RichTextView`. Adding one without
 * adding its rendering is the drift this single list exists to prevent.
 */
export interface ToolCommand {
  key: 'bold' | 'italic' | 'h' | 'ul' | 'ol';
  /** The `document.execCommand` name — the web half's mechanism, ignored on touch. */
  cmd: string;
  arg?: string;
  /** Which of `RichTextWords` names the button. */
  word: 'bold' | 'italic' | 'heading' | 'bulletedList' | 'numberedList';
  /** The icon, shared so the two platforms cannot draw different toolbars. */
  glyph: ShellGlyphName;
}

export const CMD: ToolCommand[] = [
  { key: 'bold', cmd: 'bold', word: 'bold', glyph: 'bold' },
  { key: 'italic', cmd: 'italic', word: 'italic', glyph: 'italic' },
  { key: 'h', cmd: 'formatBlock', arg: 'h3', word: 'heading', glyph: 'heading' },
  { key: 'ul', cmd: 'insertUnorderedList', word: 'bulletedList', glyph: 'list-bullet' },
  { key: 'ol', cmd: 'insertOrderedList', word: 'numberedList', glyph: 'list-number' },
];

export const LINK_GLYPH: ShellGlyphName = 'link-wide';

/** The link field's hint: a scheme, read the same in every language. */
export const LINK_SCHEME = 'https://';
