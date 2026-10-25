/**
 * The brand colour field's words (`BrandColorField`, `F7-07`, `SCR-M01-18`), authored once for both
 * platforms. A sentence that names which ink rides on the colour is one whole message per ink, never
 * a name joined into a sentence: word order differs by language. Ratios are the field's own figures.
 */
import type { MessageRef, Translator } from '../runtime';

type T = Translator['t'];
type Ink = 'white' | 'near-black';

const FIELD = {
  label: /*i18n*/ { id: 'Primary brand colour' },
  helper: /*i18n*/ {
    id: 'Used on the proposal PDF and the customer link page. The HelioGrid app itself is never restyled.',
  },
  hexLabel: /*i18n*/ { id: 'Hex' },
  hexHelper: /*i18n*/ { id: 'Enter a 6-digit hex colour, like #1F5FA9' },
  hexError: /*i18n*/ { id: "That isn't a hex colour." },
  specimenLabel: /*i18n*/ { id: 'On the proposal' },
  specimenWord: /*i18n*/ { id: 'Solar proposal' },
  specimenKind: /*i18n*/ { id: 'Proposal' },
  noTextOnIt: /*i18n*/ {
    id: "Text can't sit on this colour, so the cover keeps a white header and its headings use a darker shade.",
  },
  inkWords: /*i18n*/ { id: 'Use {hex}' },
  inkCaption: /*i18n*/ { id: 'The same hue, a shade darker.' },
  useIt: /*i18n*/ { id: 'Use it' },
  textOnFails: /*i18n*/ {
    id: 'No text colour clears {floor}:1 on this — white reaches {white}:1 and near-black {black}:1. A header band in it would be unreadable on a printed proposal.',
  },
  wordPasses: /*i18n*/ {
    id: 'As a word on white paper it is {ratio}:1 — headings and totals can be set in it.',
  },
  wordFillsAndRules: /*i18n*/ {
    id: 'As a word on white paper it is only {ratio}:1, so the proposal sets its headings and totals in {ink}, the same hue darkened to {inkRatio}:1, and uses this colour as a fill and rules — above the {markFloor}:1 mark floor.',
  },
  wordFillsOnly: /*i18n*/ {
    id: 'As a word on white paper it is only {ratio}:1, so the proposal sets its headings and totals in {ink}, the same hue darkened to {inkRatio}:1, and uses this colour as a fill — below even the {markFloor}:1 mark floor, so hairlines in it will not read either.',
  },
  inkNote: /*i18n*/ { id: 'Same hue, darkened to {ratio}:1.' },
} as const;

const READS_WELL: Record<Ink, MessageRef> = {
  white: /*i18n*/ { id: 'Reads well — white text on it, headings in it.' },
  'near-black': /*i18n*/ { id: 'Reads well — near-black text on it, headings in it.' },
};
const FILLS_AND_LINES: Record<Ink, MessageRef> = {
  white: /*i18n*/ {
    id: 'White text reads on it. Headings use a darker shade; this colour stays for fills and lines.',
  },
  'near-black': /*i18n*/ {
    id: 'Near-black text reads on it. Headings use a darker shade; this colour stays for fills and lines.',
  },
};
const FILLS_ONLY: Record<Ink, MessageRef> = {
  white: /*i18n*/ {
    id: 'White text reads on it. Headings and lines use a darker shade; this colour stays for fills only.',
  },
  'near-black': /*i18n*/ {
    id: 'Near-black text reads on it. Headings and lines use a darker shade; this colour stays for fills only.',
  },
};
const TEXT_ON_PASSES: Record<Ink, MessageRef> = {
  white: /*i18n*/ {
    id: 'White text on this colour is {ratio}:1 — clears the {floor}:1 floor, so the proposal header uses white.',
  },
  'near-black': /*i18n*/ {
    id: 'Near-black text on this colour is {ratio}:1 — clears the {floor}:1 floor, so the proposal header uses near-black.',
  },
};

/** Stands where the hex goes, so the words either side of it come from one whole message. */
const HEX_SLOT = '\u0000';

/** The words either side of `{hex}` in one translated message. */
function around(t: T, message: MessageRef): { before: string; after: string } {
  const [before = '', after = ''] = t(message, { hex: HEX_SLOT }).split(HEX_SLOT);
  return { before, after };
}

/** Every word `BrandColorField` draws, in the reader's language — its `words` prop. */
export function brandColourFieldWords(t: T) {
  return {
    label: t(FIELD.label),
    helper: t(FIELD.helper),
    hexLabel: t(FIELD.hexLabel),
    hexHelper: t(FIELD.hexHelper),
    hexError: t(FIELD.hexError),
    specimenLabel: t(FIELD.specimenLabel),
    specimenWord: t(FIELD.specimenWord),
    specimenKind: t(FIELD.specimenKind),
    short: {
      readsWell: (text: Ink) => t(READS_WELL[text]),
      noTextOnIt: t(FIELD.noTextOnIt),
      fillsAndLines: (text: Ink) => t(FILLS_AND_LINES[text]),
      fillsOnly: (text: Ink) => t(FILLS_ONLY[text]),
    },
    ink: {
      inkWords: (_hex: string) => around(t, FIELD.inkWords),
      caption: t(FIELD.inkCaption),
      act: t(FIELD.useIt),
    },
    full: {
      textOnPasses: (s: { text: Ink; ratio: string; floor: string }) =>
        t(TEXT_ON_PASSES[s.text], { ratio: s.ratio, floor: s.floor }),
      textOnFails: (s: { white: string; black: string; floor: string }) => t(FIELD.textOnFails, s),
      wordPasses: (s: { ratio: string }) => t(FIELD.wordPasses, s),
      wordFillsAndRules: (s: { ratio: string; ink: string; inkRatio: string; markFloor: string }) =>
        t(FIELD.wordFillsAndRules, s),
      wordFillsOnly: (s: { ratio: string; ink: string; inkRatio: string; markFloor: string }) =>
        t(FIELD.wordFillsOnly, s),
      takeHexWords: (hex: string) => t(FIELD.inkWords, { hex }),
      inkNote: (s: { ratio: string }) => t(FIELD.inkNote, s),
    },
  };
}

export type BrandColourFieldWords = ReturnType<typeof brandColourFieldWords>;
