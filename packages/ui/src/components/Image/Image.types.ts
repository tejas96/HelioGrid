import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';

export type ImageStatus = 'auto' | 'loading' | 'present' | 'missing';
export type ImageMissingReason = 'not-captured' | 'unavailable';

export interface ImageProps {
  src?: string;
  /**
   * Accessible name. Also folded into the missing state's label, so a screen reader is told
   * WHICH photo is absent, not just that something is. None: the photo is decoration.
   */
  alt?: TranslatedText;
  /**
   * Force a state for specimens and print proofs. Default "auto": no src → missing,
   * load error → missing (reason "unavailable"), decoded → present, otherwise loading.
   */
  status?: ImageStatus;
  /**
   * Footprint. "photo" 4:3 · "wide" 16:9 · "square" · "portrait" 3:4, or any CSS aspect-ratio.
   * Reserved before the image loads — this is what keeps print pagination stable.
   */
  ratio?: 'photo' | 'wide' | 'square' | 'portrait' | string;
  width?: number | string;
  /** Fixed height instead of a ratio. One of ratio/height always applies; never neither. */
  height?: number | string;
  fit?: 'cover' | 'contain';
  /** A CSS `object-position` value. Web only — React Native's Image has no positional control. */
  position?: string;
  radius?: number;
  /** The photo's own caption, as whoever captured it wrote it. */
  // biome-ignore lint/plugin/copy-prop-type: a photo's own caption — what the person who took it wrote
  caption?: string;
  /** Who took it — the shadow set captions each shot with a name and a date/hour. */
  credit?: string;
  /**
   * @deprecated Use `credit`. `attribution` is the system's `ValueSource` slot (which layer
   * supplied an un-overridden value) and an image frame has no such fact; passing it here warns.
   */
  attribution?: string;
  meta?: string;
  /** Suppressed while the image is missing: shortfall reports before age (MS11-11). */
  staleAt?: string;
  /**
   * M05-29: survey photographs are reference and are never measured from. Shows in all three
   * states — the law doesn't lapse because the photo hasn't loaded.
   */
  referenceOnly?: boolean;
  /** The chip on the frame. Default: `words.referenceOnly`. */
  referenceLabel?: TranslatedText;
  /** The caption line that says why. Default: `words.neverMeasured`. */
  referenceNote?: TranslatedText;
  /**
   * "not-captured" (nobody took it — permanent, neutral) vs "unavailable" (the fetch failed —
   * warning tint, retryable). Set automatically to "unavailable" on a load error.
   */
  missingReason?: ImageMissingReason;
  /** The missing face's words. Default: the reason's own, from `words.missing`. */
  missingLabel?: TranslatedText;
  /** The missing face's sentence. Default: the reason's own; `""` draws none. */
  missingDetail?: TranslatedText | '';
  onRetry?: () => void;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  onClick?: () => void;
  /**
   * Default false. Lazy images that haven't loaded when print fires paginate an empty frame.
   * Web only — React Native decodes on mount and has no lazy attribute.
   */
  lazy?: boolean;
  density?: 'expressive' | 'functional';
  /** The frame's own words — each kind of missing, the reference chip, the photo's age. */
  words: ImageWords;
}

/** One kind of missing in words: what the face says, and the sentence under it. */
export interface ImageMissingWords {
  label: TranslatedText;
  detail: TranslatedText;
}

/** The words an image frame says itself, in the reader's language (`@heliogrid/i18n`'s `imageWords`). */
export interface ImageWords {
  /** Each kind of missing — they are different facts, so they never read alike. */
  missing: Readonly<Record<ImageMissingReason, ImageMissingWords>>;
  /** The missing face's name with the photo's own — *Roof, south face — Not captured*. */
  missingNamed(alt: string, missing: string): TranslatedText;
  /** The reference chip, and its short form on a compact frame. */
  referenceOnly: TranslatedText;
  referenceShort: TranslatedText;
  /** The caption line a reference photo carries. */
  neverMeasured: TranslatedText;
  /** How old the photo is — *As of {date}*, the date already written. */
  asOf(date: string): TranslatedText;
}

export interface ThumbnailProps extends Omit<ImageProps, 'width'> {
  size?: number;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface ImageMissingProps
  extends Pick<ImageProps, 'alt' | 'missingLabel' | 'missingDetail' | 'onRetry' | 'retryLabel'> {
  width?: number | string;
  reason: ImageMissingReason;
  words: ImageWords;
  /** The image's frame, where focus lands once the retry has left. */
  focusAfter: FocusAfter;
}
