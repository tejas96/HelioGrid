export interface BrandColorFieldProps {
  /** "#RRGGBB". Accepts "#RGB" and a missing hash on entry; always reports "#RRGGBB". */
  value?: string;
  /** Fires only with a valid, normalised hex — an unparseable draft never commits. */
  onChange?: (hex: string) => void;
  label?: string;
  /**
   * Defaults to the `F7-07` statement, naming **both** surfaces the brand colour rides: *"Used on the
   * proposal PDF and the customer link page. The HelioGrid app itself is never restyled."*
   */
  helper?: string;
  /**
   * Curated starting colours. Deliberately a short list of document-safe darks rather than a
   * free spectrum — a tenant who needs their exact brand hex types it.
   */
  presets?: string[];
  specimenLabel?: string;
  /** Name drawn in the document specimen. */
  companyName?: string;
  /** Offer a darkened shade when no text colour clears the floor. Default true. */
  showSuggestion?: boolean;
  disabled?: boolean;
  density?: 'expressive' | 'functional';
}

/** The three verdict tones. A word plus a glyph, never a colour alone (F7-12). */
export type BrandVerdictKind = 'pass' | 'warn' | 'info';

/** One measured sentence about the colour, plus the channel that is not its tint. */
export interface BrandVerdict {
  kind: BrandVerdictKind;
  sentence: string;
}
