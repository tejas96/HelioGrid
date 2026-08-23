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
  /** The icon path, shared so the two platforms cannot draw different toolbars. */
  d: string;
}

export const CMD: ToolCommand[] = [
  {
    key: 'bold',
    cmd: 'bold',
    label: 'Bold',
    d: 'M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z',
  },
  { key: 'italic', cmd: 'italic', label: 'Italic', d: 'M15 5h-5M14 19H9M14.5 5 9.5 19' },
  { key: 'h', cmd: 'formatBlock', arg: 'h3', label: 'Heading', d: 'M6 5v14M18 5v14M6 12h12' },
  {
    key: 'ul',
    cmd: 'insertUnorderedList',
    label: 'Bulleted list',
    d: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  },
  {
    key: 'ol',
    cmd: 'insertOrderedList',
    label: 'Numbered list',
    d: 'M10 6h10M10 12h10M10 18h10M4 6h2v4M4 18h2.5M4 14h2v4',
  },
];

export const LINK_PATH =
  'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1';
