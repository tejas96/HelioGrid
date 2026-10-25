import { path, rect } from './ShellGlyph.marks';

/**
 * The catalog's glyphs (`SCR-M01-15`): the row acts and the kind tiles, drawn as its locked
 * boards draw them. Joined into `SHELL_GLYPHS`, which every caller reads.
 */
export const CATALOG_GLYPHS = {
  star: [path('m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8z')],
  archive: [
    rect(3, 4, 18, 4, 1.4),
    path('M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8'),
    path('M10 12h4'),
  ],
  sort: [path('M7 4v16'), path('m3 8 4-4 4 4'), path('M17 20V4'), path('m13 16 4 4 4-4')],
  'solar-panel': [path('M4 5h16v14H4z'), path('M4 12h16'), path('M12 5v14')],
  inverter: [path('M5 4h14v16H5z'), path('M9 9h6'), path('M9 13h6')],
  battery: [path('M6 7h10v12H6z'), path('M10 4h2v3h-2z'), path('M9 12h4')],
} as const;
