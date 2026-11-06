/**
 * Three faces: Newsreader, an editorial serif, for page titles and hero figures; Geist for every
 * word of the interface; Geist Mono for phones, IDs and money in lists. Newsreader and Geist carry
 * no Devanagari, so each stack names the Noto face that matches its tone, and Hindi and Marathi
 * read as designed; Geist closes the display stack for the symbols the serif lacks (→, ≈). A browser falls back per character; the phone reads `scriptStack`.
 */
export const FONT_STACKS = {
  display: ['Newsreader', 'Noto Serif Devanagari', 'Geist', 'Georgia', 'serif'],
  sans: ['Geist', 'Noto Sans Devanagari', '-apple-system', 'system-ui', 'sans-serif'],
  mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
} as const;

export type FontStack = keyof typeof FONT_STACKS;

/**
 * The bundled faces: the web's files (a variable face, split by `unicodeRange` where the source is)
 * and the static weights the phone ships for each family.
 */
export const BUNDLED_FACES = [
  {
    family: 'Newsreader',
    web: [
      {
        file: 'Newsreader-latin[opsz,wght].woff2',
        unicodeRange:
          'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
      },
      {
        file: 'Newsreader-latin-ext[opsz,wght].woff2',
        unicodeRange:
          'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
      },
    ],
    phoneWeights: [400, 500],
  },
  {
    family: 'Noto Serif Devanagari',
    web: [{ file: 'NotoSerifDevanagari[wght].woff' }],
    phoneWeights: [400, 500],
  },
  { family: 'Geist', web: [{ file: 'Geist[wght].woff2' }], phoneWeights: [400, 500, 600, 700] },
  {
    family: 'Noto Sans Devanagari',
    web: [{ file: 'NotoSansDevanagari[wght].woff2' }],
    phoneWeights: [400, 500, 600, 700],
  },
  {
    family: 'Geist Mono',
    web: [{ file: 'GeistMono[wght].woff2' }],
    phoneWeights: [400, 500, 600, 700],
  },
] as const satisfies readonly {
  family: string;
  web: readonly { file: string; unicodeRange?: string }[];
  phoneWeights: readonly number[];
}[];

export const WEIGHTS = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

/** The weights the display face sets: a title and a hero figure never go heavier. */
export const DISPLAY_WEIGHTS = [400, 500] as const;

export interface TypeRole {
  readonly size: number;
  readonly lineHeight: number;
  /** In em. */
  readonly tracking: number;
}

/**
 * The type scale. `hero` is the one figure a screen is about; `display` the large page title;
 * `figure` a hero's secondary numbers. Line heights leave room for matras and conjuncts.
 */
export const TYPE_ROLES = {
  hero: { size: 72, lineHeight: 76, tracking: -0.03 },
  'hero-phone': { size: 46, lineHeight: 52, tracking: -0.03 },
  display: { size: 40, lineHeight: 46, tracking: -0.015 },
  figure: { size: 28, lineHeight: 34, tracking: -0.01 },
  h1: { size: 32, lineHeight: 38, tracking: -0.015 },
  h2: { size: 20, lineHeight: 28, tracking: -0.01 },
  h3: { size: 17, lineHeight: 24, tracking: -0.005 },
  h4: { size: 15, lineHeight: 22, tracking: 0 },
  'body-lg': { size: 17, lineHeight: 26, tracking: 0 },
  body: { size: 15, lineHeight: 22, tracking: 0 },
  'body-sm': { size: 13, lineHeight: 20, tracking: 0 },
  caption: { size: 12, lineHeight: 16, tracking: 0 },
  overline: { size: 11, lineHeight: 16, tracking: 0.08 },
  button: { size: 15, lineHeight: 20, tracking: -0.005 },
  table: { size: 13, lineHeight: 19, tracking: 0 },
} as const satisfies Record<string, TypeRole>;

export type TypeRoleName = keyof typeof TYPE_ROLES;

/** The three sizes every field shares: its label, its value, its helper or error line. */
export const FIELD_TYPE = { label: 13, value: 16, helper: 12 } as const;
