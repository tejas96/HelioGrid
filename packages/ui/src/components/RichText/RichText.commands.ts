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
  label: string;
  /** The icon, shared so the two platforms cannot draw different toolbars. */
  glyph: ShellGlyphName;
}

export const CMD: ToolCommand[] = [
  {
    key: 'bold',
    cmd: 'bold',
    label: 'Bold',
    glyph: 'bold',
  },
  { key: 'italic', cmd: 'italic', label: 'Italic', glyph: 'italic' },
  { key: 'h', cmd: 'formatBlock', arg: 'h3', label: 'Heading', glyph: 'heading' },
  {
    key: 'ul',
    cmd: 'insertUnorderedList',
    label: 'Bulleted list',
    glyph: 'list-bullet',
  },
  {
    key: 'ol',
    cmd: 'insertOrderedList',
    label: 'Numbered list',
    glyph: 'list-number',
  },
];

export const LINK_GLYPH: ShellGlyphName = 'link-wide';
