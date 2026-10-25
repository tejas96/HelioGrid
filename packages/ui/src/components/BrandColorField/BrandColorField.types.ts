/** Which of the document's two inks rides on the colour. The words name it; this package never does. */
export type BrandTextInk = 'white' | 'near-black';

/** `verdict="short"` — the outcome in one line, no ratio, in the words the owner reads. */
export interface BrandShortVerdictWords {
  /** Both questions pass — *Reads well — white text on it, headings in it.* */
  readsWell: (text: BrandTextInk) => string;
  /** No text clears the floor on it — *Text can't sit on this colour, so the cover keeps a white header and its headings use a darker shade.* */
  noTextOnIt: string;
  /** It cannot be a word but clears the mark floor — *White text reads on it. Headings use a darker shade; this colour stays for fills and lines.* */
  fillsAndLines: (text: BrandTextInk) => string;
  /** Under even the mark floor — *White text reads on it. Headings and lines use a darker shade; this colour stays for fills only.* */
  fillsOnly: (text: BrandTextInk) => string;
}

/** The quiet row that offers a failing colour's derived ink (`compliantShades(hex).ink`). */
export interface BrandInkOfferWords {
  /**
   * *Use {hex}* — the words either side of the hex, which the field sets in the mono face between
   * them, so a language may put the hex anywhere in its sentence.
   */
  inkWords: (hex: string) => { before: string; after: string };
  /** *The same hue, a shade darker.* */
  caption: string;
  /** *Use it* — the act that takes the ink. */
  act: string;
}

/**
 * `verdict="full"` — both questions answered with the ratio this field computed. Ratios and floors
 * arrive as the strings the field prints; the tier beside each ratio is `ProvenanceTier`'s word.
 */
export interface BrandFullVerdictWords {
  /** *White text on this colour is 5.36:1 — clears the 4.5:1 floor, so the proposal header uses white.* */
  textOnPasses: (sentence: { text: BrandTextInk; ratio: string; floor: string }) => string;
  /** *No text colour clears 4.5:1 on this — white reaches 4.45:1 and near-black 4.43:1. A header band in it would be unreadable on a printed proposal.* */
  textOnFails: (sentence: { white: string; black: string; floor: string }) => string;
  /** *As a word on white paper it is 5.36:1 — headings and totals can be set in it.* */
  wordPasses: (sentence: { ratio: string }) => string;
  /** Above the mark floor — *… so the proposal sets its headings and totals in {ink}, the same hue darkened to {inkRatio}:1, and uses this colour as a fill and rules — above the 3:1 mark floor.* */
  wordFillsAndRules: (sentence: {
    ratio: string;
    ink: string;
    inkRatio: string;
    markFloor: string;
  }) => string;
  /** Under it — *… and uses this colour as a fill — below even the 3:1 mark floor, so hairlines in it will not read either.* */
  wordFillsOnly: (sentence: {
    ratio: string;
    ink: string;
    inkRatio: string;
    markFloor: string;
  }) => string;
  /** The act that takes the ink — *Use #005ED6*. */
  takeHexWords: (hex: string) => string;
  /** Beside that act — *Same hue, darkened to 5.12:1.* */
  inkNote: (sentence: { ratio: string }) => string;
}

/**
 * Every word the field shows, in the reader's language — built from `@heliogrid/i18n`. Required:
 * the field holds no word of its own, so an untranslated line cannot ship (`ui-adherence`).
 */
export interface BrandColorFieldWords {
  /** *Primary brand colour* — the swatches' heading and the radiogroup's name. */
  label: string;
  /** The `F7-07` statement — *Used on the proposal PDF and the customer link page. The HelioGrid app itself is never restyled.* */
  helper: string;
  /** *Hex* — the precise field's label. */
  hexLabel: string;
  /** *Enter a 6-digit hex colour, e.g. #1F5FA9* — while the draft is not a colour. */
  hexHelper: string;
  /** *That isn't a hex colour.* */
  hexError: string;
  /** *On the proposal* — the specimen's overline. */
  specimenLabel: string;
  /** *Solar proposal* — the heading the specimen sets on paper. */
  specimenWord: string;
  /** *Proposal* — the word at the end of the specimen's band. */
  specimenKind: string;
  short: BrandShortVerdictWords;
  ink: BrandInkOfferWords;
  full: BrandFullVerdictWords;
}

export interface BrandColorFieldProps {
  /** Every word the field shows. */
  words: BrandColorFieldWords;
  /** "#RRGGBB". Accepts "#RGB" and a missing hash on entry; always reports "#RRGGBB". */
  value?: string;
  /** Fires only with a valid, normalised hex — an unparseable draft never commits. */
  onChange?: (hex: string) => void;
  /** Overrides `words.label`. */
  label?: string;
  /** Overrides `words.helper` (the `F7-07` statement). `""` draws no helper line. */
  helper?: string;
  /**
   * Curated starting colours. Deliberately a short list of document-safe darks rather than a
   * free spectrum — a tenant who needs their exact brand hex types it.
   */
  presets?: string[];
  /** Overrides `words.specimenLabel`. */
  specimenLabel?: string;
  /** Name drawn in the document specimen's band — the tenant's own; absent, the band draws none. */
  companyName?: string;
  /**
   * Overrides `words.specimenWord`: the word the specimen sets on paper in the colour — or, when
   * the colour cannot be a word, in its derived ink. A heading, never a figure.
   */
  specimenWord?: string;
  /**
   * Offer the derived ink — `compliantShades(hex).ink`, the walk the server runs on save — whenever
   * the colour fails EITHER question: no text can sit on it, or it cannot be a word on paper.
   * Default true.
   */
  showSuggestion?: boolean;
  /**
   * `false` drops the document specimen — for a screen that shows the live `DocumentPreview`
   * beside the field (`SCR-M01-18`). Default true.
   */
  specimen?: boolean;
  /**
   * `"short"`: one line, no ratio, naming the outcome, with the derived ink offered as a quiet row
   * and *Use it*. `"full"` (default): both questions answered with their ratios and tiers.
   */
  verdict?: 'full' | 'short';
  disabled?: boolean;
  density?: 'expressive' | 'functional';
}

/** The specimen part's contract, both halves. */
export interface BrandColorSpecimenProps {
  /** Normalised "#RRGGBB" — tenant DATA, so it is drawn inline. It is never a token. */
  hex: string;
  /** Whichever of white / near-black the document will set on the band. */
  textOn: string;
  /** The tenant's name on the band; absent, the band draws none. */
  companyName?: string;
  /** The word at the band's end — *Proposal*. */
  kindWord: string;
  /** The heading set on paper — *Solar proposal*. Never a figure (`F8-01`). */
  word: string;
  /** The colour itself when it can be a word on paper, else its derived ink. */
  wordColour: string;
}

/** The short verdict part's contract, both halves: the line, and the ink row when one is offered. */
export interface BrandShortVerdictProps {
  verdict: BrandVerdict;
  /** The derived ink offered, or null. */
  fixHex: string | null;
  words: BrandInkOfferWords;
  onUse: () => void;
  disabled: boolean;
}

/** The three verdict tones. A word plus a glyph, never a colour alone (F7-12). */
export type BrandVerdictKind = 'pass' | 'warn' | 'info';

/** One measured sentence about the colour, plus the channel that is not its tint. */
export interface BrandVerdict {
  kind: BrandVerdictKind;
  sentence: string;
}
