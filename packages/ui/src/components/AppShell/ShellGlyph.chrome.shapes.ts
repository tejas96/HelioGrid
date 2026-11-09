import { circle, type GlyphMark, path, rect } from './ShellGlyph.marks';

/**
 * The shell's own chrome: the pill's and the sidebar's destinations, the theme's moon and the
 * device's screen beside the sun, the search's Command key, and the sidebar's fold.
 */
export const CHROME_GLYPHS = {
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
  moon: [path('M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z')],
  /* A Mac's Command key, beside the letter of a shortcut: no bundled face draws ⌘ (`language-fonts`). */
  command: [path('M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3')],
  monitor: [rect(3, 4, 18, 12.5, 2), path('M8.5 20.5h7M12 16.5v4')],
  sidebar: [rect(3, 4, 18, 16, 2.5), path('M9 4v16'), path('M15.5 10l-2 2 2 2')],
} satisfies Record<string, readonly GlyphMark[]>;
