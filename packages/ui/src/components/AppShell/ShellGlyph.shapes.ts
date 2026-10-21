/** One mark of a glyph, on a 24-unit square: a path, a circle or a rounded rectangle. */
export type GlyphMark =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly rx: number;
    };

const path = (d: string): GlyphMark => ({ kind: 'path', d });
const circle = (cx: number, cy: number, r: number): GlyphMark => ({ kind: 'circle', cx, cy, r });
const rect = (x: number, y: number, width: number, height: number, rx: number): GlyphMark => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

/**
 * Every icon `packages/ui` draws, once, for both halves (`F7-19`): the shell's own (`SCR-SHELL-01`)
 * and every component's. Named for the shape, never the product word it stands for — the caller
 * picks which shape means what. The box that holds a glyph sets its size, stroke and colour.
 */
export const SHELL_GLYPHS = {
  house: [path('M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z')],
  people: [
    path('M9 4.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4'),
    path('M2.5 20a6.5 6.5 0 0 1 13 0'),
    path('M16.6 5.6a3.2 3.2 0 0 1 0 4.9'),
    path('M18 20a6.4 6.4 0 0 0-2-4.6'),
  ],
  document: [
    path('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'),
    path('M14 3v5h5'),
    path('M9 13.5h5'),
    path('M9 17h3.5'),
  ],
  board: [path('M4 4.5h16v15H4z'), path('M9.3 4.5v15'), path('M14.7 4.5v15')],
  pair: [
    circle(9, 8, 3.2),
    path('M3 20a6 6 0 0 1 12 0'),
    circle(17, 9, 2.4),
    path('M15.5 14.2A5 5 0 0 1 21 19'),
  ],
  megaphone: [
    path('M4 10v4h3l6 4V6L7 10z'),
    path('M16.5 9.5a4 4 0 0 1 0 5'),
    path('M19 7a7.5 7.5 0 0 1 0 10'),
  ],
  dots: [circle(5, 12, 1.7), circle(12, 12, 1.7), circle(19, 12, 1.7)],
  'plus-circle': [circle(12, 12, 9), path('M12 8v8M8 12h8')],
  plus: [path('M12 5v14M5 12h14')],
  search: [circle(11, 11, 7), path('m20 20-3.5-3.5')],
  bell: [path('M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8'), path('M13.7 21a2 2 0 0 1-3.4 0')],
  chevron: [path('m6 9 6 6 6-6')],
  'chevron-right': [path('m9 6 6 6-6 6')],
  'chevron-left': [path('m15 6-6 6 6 6')],
  building: [
    path('M6 2.5h12a1 1 0 0 1 1 1v18H5v-18a1 1 0 0 1 1-1z'),
    path('M9 21.5v-4h6v4'),
    path(
      'M8 6.5h.01M12 6.5h.01M16 6.5h.01M8 10.5h.01M12 10.5h.01M16 10.5h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01',
    ),
  ],
  palette: [
    path(
      'M12 2.5a9.5 9.5 0 1 0 0 19c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9a5.3 5.3 0 0 0 5.2-5.3C21.5 6.3 17.2 2.5 12 2.5z',
    ),
    circle(13.5, 6.5, 0.6),
    circle(17.5, 10.5, 0.6),
    circle(8.5, 7.5, 0.6),
    circle(6.5, 12.5, 0.6),
  ],
  'calendar-clock': [
    path('M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5'),
    path('M16 2v4M8 2v4M3 10h5'),
    circle(16, 16, 5.5),
    path('M16 13.5V16l1.7 1.2'),
  ],
  package: [
    path('m7.5 4.3 9 5.1'),
    path(
      'M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    ),
    path('m3.3 7 8.7 5 8.7-5'),
    path('M12 22V12'),
  ],
  headset: [
    path('M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3z'),
    path('M21 14h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3z'),
    path('M3 18v-6a9 9 0 0 1 18 0v6'),
    path('M21 19v1a3 3 0 0 1-3 3h-5'),
  ],
  wallet: [
    path(
      'M19 7V4.5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2',
    ),
    path('M3 5.5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'),
  ],
  'credit-card': [
    path('M3 6.5h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z'),
    path('M2 10.5h20'),
  ],
  gauge: [path('m12 14 4-4'), path('M3.3 19a10 10 0 1 1 17.4 0')],
  shield: [
    path('M12 3.2 18.5 5.8v5.4c0 4.2-2.7 7.2-6.5 8.6-3.8-1.4-6.5-4.4-6.5-8.6V5.8z'),
    path('m9.4 12 1.9 1.9 3.4-3.5'),
  ],
  'sign-out': [
    path('M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3'),
    path('m10 8-4 4 4 4'),
    path('M6 12h9'),
  ],
  lock: [
    path(
      'M7 10.5h10a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18v-5A2.5 2.5 0 0 1 7 10.5z',
    ),
    path('M8 10.5V8a4 4 0 0 1 8 0v2.5'),
  ],
  download: [path('M12 3v12'), path('m7 10 5 5 5-5'), path('M5 20h14')],
  undo: [path('M3 7v6h6'), path('M21 17a9 9 0 0 0-15-6.7L3 13')],
  'user-minus': [
    path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'),
    circle(9, 7, 4),
    path('M22 11h-6'),
  ],
  send: [path('M22 2 11 13'), path('M22 2l-7 20-4-9-9-4 20-7z')],
  close: [path('M18 6 6 18M6 6l12 12')],
  alert: [path('M12 9v4M12 17h.01')],
  'alert-circle': [circle(12, 12, 9), path('M12 9v4M12 17h.01')],
  'minus-circle': [circle(12, 12, 9), path('M8 12h8')],
  tick: [path('m5 13 4 4L19 7')],
  'tick-long': [path('M20 6 9 17l-5-5')],
  'tick-small': [path('M5 13 10 18l9-10')],
  'chevron-up': [path('m6 15 6-6 6 6')],
  lines: [path('M4 6h16M4 12h16M4 18h10')],
  trash: [path('M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6')],
  layers: [path('M12 3 3 8l9 5 9-5-9-5Z'), path('m3 14 9 5 9-5')],
  clock: [circle(12, 12, 9), path('M12 7.5V12l3 2')],
  note: [path('M5 4h11l3 3v13H5z'), path('M9 11h6M9 15h4')],
  phone: [
    path(
      'M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z',
    ),
  ],
  flag: [path('M6 21V4h12l-2.5 4L18 12H6')],
  user: [circle(12, 8, 3.2), path('M5.5 20a6.5 6.5 0 0 1 13 0')],
  file: [path('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'), path('M14 3v5h5')],
  link: [
    path('M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1'),
    path('M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1'),
  ],
  clipboard: [rect(6, 4, 12, 17, 2), path('M9 3h6v3H9zM9 12h6M9 16h4')],
  grid: [
    rect(4, 4, 7, 7, 1.5),
    rect(13, 4, 7, 7, 1.5),
    rect(4, 13, 7, 7, 1.5),
    rect(13, 13, 7, 7, 1.5),
  ],
  rupee: [path('M8 5h8M8 9h8M14 5c0 4-2.5 4-6 4l7 10')],
  cog: [
    circle(12, 12, 3),
    path('M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5 8 8M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5'),
  ],
  'bell-short': [path('M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z'), path('M10 19a2 2 0 0 0 4 0')],
  'undo-loop': [path('M4 10h9a5 5 0 1 1 0 10H8'), path('m8 6-4 4 4 4')],
  dot: [circle(12, 12, 3.5)],
  eye: [
    path('M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z'),
    circle(12, 12, 3),
  ],
  'calendar-check': [
    rect(4, 5, 16, 16, 2),
    path('M8 3v4M16 3v4M4 10h16'),
    path('m9.5 15 2 2 3.5-3.5'),
  ],
  'clock-small': [circle(12, 12, 8.5), path('M12 7.5V12l3 2')],
  'bar-chart': [path('M4 20V9M10 20V4M16 20v-7M22 20H2')],
  'check-check': [path('M17 7 7.5 16.5 3 12'), path('m21.5 9-7.5 7.5-1.5-1.5')],
  'user-plus': [circle(10, 8, 3.4), path('M3.5 20a6.5 6.5 0 0 1 13 0'), path('M18 6.5v6M15 9.5h6')],
  chat: [path('M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.4-4.7A7.5 7.5 0 1 1 20 12z')],
  'plus-small': [path('M12 6v12M6 12h12')],
  play: [path('M8 5.2v13.6L19 12z')],
  pause: [rect(7, 5, 3.6, 14, 1.2), rect(13.4, 5, 3.6, 14, 1.2)],
  rewind: [path('M11 6 5 12l6 6M19 6l-6 6 6 6')],
  'fast-forward': [path('M13 6l6 6-6 6M5 6l6 6-6 6')],
  'mic-off': [
    path('M9 9V6a3 3 0 0 1 5.5-1.7'),
    path('M15 11v-1'),
    path('M19 11a7 7 0 0 1-10.4 6.1M5 11a7 7 0 0 0 2 4.9'),
    path('M12 18v3'),
    path('m3 3 18 18'),
  ],
  'file-text': [
    path('M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z'),
    path('M14 3v5h5M9 13h6M9 17h4'),
  ],
  'info-circle': [circle(12, 12, 9), path('M12 11v5M12 8h.01')],
  'rupee-wide': [path('M7 5h10M7 9h10M15 5c0 4-3.5 4-8 4l8 10')],
  'warning-triangle': [path('M12 3 3 20h18z'), path('M12 10v4M12 17h.01')],
  spark: [
    path('M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18'),
  ],
  'arrow-right': [path('M5 12h13M13 6l6 6-6 6')],
  'alert-triangle': [
    path(
      'M12 9v4m0 3.5v.01M10.3 3.9 2.7 17a1.6 1.6 0 0 0 1.4 2.4h15.8a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0z',
    ),
  ],
  'info-ring': [path('M12 16v-4m0-3.5v-.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z')],
  'arrow-up-right': [path('M7 17 17 7M17 7h-7m7 0v7')],
  'alert-ring': [circle(12, 12, 9), path('M12 7.5v5'), path('M12 16.25h.01')],
  columns: [rect(3, 4, 7, 16, 1.5), rect(14, 4, 7, 16, 1.5)],
  'shield-check': [
    path('M12 3.2 5 6.1v5.6c0 4.1 2.8 7.3 7 9 4.2-1.7 7-4.9 7-9V6.1l-7-2.9Z'),
    path('M9.2 12.2l2 2 3.6-3.9'),
  ],
  'lines-wide': [path('M3 6h18M3 12h18M3 18h10')],
  'caret-down': [path('M6 10l6 6 6-6')],
  'caret-up': [path('M6 14l6-6 6 6')],
  calendar: [rect(3, 5, 18, 16, 2.5), path('M3 10h18M8 3v4M16 3v4')],
  ring: [circle(12, 12, 9)],
  'arrow-north': [path('M12 4v11'), path('m9 7 3-3 3 3')],
  minus: [path('M5 12h14')],
  camera: [
    path('M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z'),
    circle(12, 13, 3.5),
  ],
  'info-open': [circle(12, 12, 9), path('M12 11.25v5')],
  'info-dot': [circle(12, 7.6, 1)],
  sliders: [path('M4 7h9M17 7h3M4 17h3M11 17h9'), circle(15, 7, 2.2), circle(9, 17, 2.2)],
  'alert-long': [path('M12 7v7M12 17.5h.01')],
  'alert-mid': [path('M12 8v5M12 16.5h.01')],
  'image-off': [
    rect(3, 4, 18, 16, 3),
    path('m5 17 4.5-4.5L13 16l2.5-2.5L21 19'),
    path('m3 3 18 18'),
  ],
  'cloud-off': [
    path('M7 18a4 4 0 0 1 .6-8 6 6 0 0 1 11.3 1.6A3.5 3.5 0 0 1 18 18z'),
    path('m3 3 18 18'),
  ],
  'eye-wide': [path('M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z'), circle(12, 12, 3)],
  kanban: [rect(3, 4, 5, 16, 1.5), rect(10, 4, 5, 10, 1.5), rect(17, 4, 4, 7, 1.5)],
  recentre: [path('M12 3v3M12 18v3M3 12h3M18 12h3'), circle(12, 12, 4)],
  map: [path('M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z'), path('M9 4v14M15 6v14')],
  pin: [path('M12 22s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z')],
  'pin-tick': [path('M8.6 10.9l2.4 2.3 4-4.3')],
  'pin-hole': [circle(12, 11, 2.6)],
  'dots-small': [circle(5, 12, 1.6), circle(12, 12, 1.6), circle(19, 12, 1.6)],
  'undo-step': [path('M9 14 5 10l4-4'), path('M5 10h9a5 5 0 0 1 0 10h-3')],
  bold: [path('M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z')],
  italic: [path('M15 5h-5M14 19H9M14.5 5 9.5 19')],
  heading: [path('M6 5v14M18 5v14M6 12h12')],
  'list-bullet': [path('M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01')],
  'list-number': [path('M10 6h10M10 12h10M10 18h10M4 6h2v4M4 18h2.5M4 14h2v4')],
  'link-wide': [
    path('M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1'),
  ],
  person: [circle(12, 8, 3.6), path('M5 20a7 7 0 0 1 14 0')],
  'minus-circle-short': [circle(12, 12, 9), path('M8.5 12h7')],
  'alert-circle-up': [circle(12, 12, 9), path('M12 8v4M12 16h.01')],
  'file-plain': [
    path('M14 3v5h5'),
    path('M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z'),
  ],
  'fit-width': [path('M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4')],
  'fit-page': [path('M5 4h14v16H5zM9 9h6v6H9z')],
  'trend-up': [path('M7 17 17 7M17 7H9m8 0v8')],
  'trend-down': [path('M7 7l10 10M17 17H9m8 0V9')],
  'alert-bold': [path('M12 7v6m0 3.5v.01')],
  'alert-small': [path('M12 6v7M12 18h.02')],
  'close-small': [path('M7 7l10 10M17 7 7 17')],
  'clock-tall': [circle(12, 12, 9), path('M12 7v5l3 2')],
  'person-slim': [circle(12, 8, 3.5), path('M5 20a7 7 0 0 1 14 0')],
  globe: [circle(12, 12, 9), path('M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18')],
  blocked: [circle(12, 12, 9), path('m5.6 5.6 12.8 12.8')],
  layer: [path('M12 3 3 8l9 5 9-5-9-5Z')],
  'arrow-right-full': [path('M5 12h14M13 6l6 6-6 6')],
  'arrow-down': [path('M12 5v14M6 13l6 6 6-6')],
  attention: [path('M12 8v5'), path('M12 16h.01')],
  'person-plus': [
    circle(9, 7, 4),
    path('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M19 8v6M22 11h-6'),
  ],
  'house-door': [path('M3 9.5 12 3l9 6.5M5 10.5V21h14V10.5M9 21v-5h6v5')],
} satisfies Record<string, readonly GlyphMark[]>;

/** A glyph's name: a key of `SHELL_GLYPHS`, so a name with no drawing cannot be written. */
export type ShellGlyphName = keyof typeof SHELL_GLYPHS;

/** The filled forms; a glyph with none stays outlined in view. */
export const SHELL_GLYPHS_FILLED: Partial<Record<ShellGlyphName, readonly GlyphMark[]>> = {
  house: [path('M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-6v-6h-4v6H4a1 1 0 0 1-1-1z')],
  people: [circle(12, 8, 3.7), path('M5 20.5a7 7 0 0 1 14 0z')],
  document: [path('M13.6 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4z')],
  dots: [circle(5, 12, 1.7), circle(12, 12, 1.7), circle(19, 12, 1.7)],
};
