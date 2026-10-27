import { path } from './ShellGlyph.marks';

/**
 * The project journey's glyphs (`SCR-M01-20`): the stages of `M08-08`'s chain that the set did not
 * already draw, as the Payment terms board's stage picker draws them. Joined into `SHELL_GLYPHS`,
 * which every caller reads.
 */
export const JOURNEY_GLYPHS = {
  'circle-check': [path('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'), path('m9 12 2 2 4-4')],
  cart: [path('M3 4h2l2.2 10.5h10.6L20 7H6.2'), path('M9 20h.01'), path('M17 20h.01')],
  truck: [
    path('M3 7h11v9H3z'),
    path('M14 10h4l3 3v3h-7'),
    path('M7 18.5a1.5 1.5 0 1 0 0 .01'),
    path('M17 18.5a1.5 1.5 0 1 0 0 .01'),
  ],
  wrench: [
    path('M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z'),
  ],
  sun: [
    path('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'),
    path('M12 2v2'),
    path('M12 20v2'),
    path('M4.9 4.9l1.4 1.4'),
    path('M17.7 17.7l1.4 1.4'),
    path('M2 12h2'),
    path('M20 12h2'),
    path('M4.9 19.1l1.4-1.4'),
    path('M17.7 6.3l1.4-1.4'),
  ],
  key: [path('M15 7a4 4 0 1 0-3.9 5L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0 0 15 7z')],
} as const;
