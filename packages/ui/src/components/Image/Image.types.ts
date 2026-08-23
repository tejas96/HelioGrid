export type ImageStatus = 'auto' | 'loading' | 'present' | 'missing';
export type ImageMissingReason = 'not-captured' | 'unavailable';

export interface ImageProps {
  src?: string;
  /**
   * Accessible name. Also folded into the missing state's label, so a screen reader is told
   * WHICH photo is absent, not just that something is.
   */
  alt?: string;
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
  referenceLabel?: string;
  referenceNote?: string;
  /**
   * "not-captured" (nobody took it — permanent, neutral) vs "unavailable" (the fetch failed —
   * warning tint, retryable). Set automatically to "unavailable" on a load error.
   */
  missingReason?: ImageMissingReason;
  missingLabel?: string;
  missingDetail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  onClick?: () => void;
  /**
   * Default false. Lazy images that haven't loaded when print fires paginate an empty frame.
   * Web only — React Native decodes on mount and has no lazy attribute.
   */
  lazy?: boolean;
  density?: 'expressive' | 'functional';
}

export interface ThumbnailProps extends Omit<ImageProps, 'width'> {
  size?: number;
}
