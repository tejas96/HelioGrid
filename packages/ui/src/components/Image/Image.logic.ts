import type { TranslatedText } from '@heliogrid/contracts';
import type { ImageGlyphName, ImageMissingSpec } from './Image.missing';
import {
  IMAGE_COMPACT_BELOW,
  IMAGE_LABEL_ABOVE,
  IMAGE_MISSING,
  IMAGE_RATIOS,
} from './Image.missing';
import type {
  ImageMissingProps,
  ImageMissingReason,
  ImageMissingWords,
  ImageProps,
  ImageStatus,
  ImageWords,
} from './Image.types';

/** What a frame takes when the caller names nothing. */
export const IMAGE_DEFAULTS = {
  status: 'auto',
  ratio: 'photo',
  width: '100%',
  fit: 'cover',
  missingReason: 'not-captured',
  density: 'expressive',
} as const;

/** A thumbnail: the same three states in a small, functional square. */
export const THUMBNAIL_DEFAULTS = {
  size: 64,
  ratio: 'square',
  radius: 12,
  density: 'functional',
} as const;

/** The frame's corner: the caller's, else the density's own. */
export function imageRadiusOf(
  radius: number | undefined,
  density: NonNullable<ImageProps['density']>,
): number {
  return radius ?? (density === 'functional' ? 12 : 20);
}

/** A named footprint's CSS ratio — "photo" is "4 / 3"; anything else is the caller's own ratio. */
export function aspectRatioOf(ratio: string): string {
  return IMAGE_RATIOS[ratio] ?? ratio;
}

/** The three faces of the one footprint. `missing` is a RESTING state, never an error. */
export type ImageState = 'loading' | 'present' | 'missing';

export interface ImageView {
  state: ImageState;
  /** Why it is missing. A fetch that failed outranks the caller's reason. */
  reason: ImageMissingReason;
}

/**
 * Which face the frame shows, and — when it is missing — which of the two kinds of missing it is.
 * A `status` other than "auto" is the caller's own answer (specimens, print proofs) and wins.
 */
export function imageView(
  status: ImageStatus,
  src: string | undefined,
  loaded: boolean,
  failed: boolean,
  missingReason: ImageMissingReason,
): ImageView {
  const auto = !src || failed ? 'missing' : loaded ? 'present' : 'loading';
  return {
    state: status === 'auto' ? auto : status,
    reason: failed && src ? 'unavailable' : missingReason,
  };
}

/** The words and marks for one kind of missing; an unknown reason falls back to "not-captured". */
export function missingSpec(reason: ImageMissingReason): ImageMissingSpec {
  return IMAGE_MISSING[reason] ?? IMAGE_MISSING['not-captured'];
}

/** The words for one kind of missing; an unknown reason falls back to "not-captured", as its look does. */
export function missingWords(reason: ImageMissingReason, words: ImageWords): ImageMissingWords {
  return words.missing[reason] ?? words.missing['not-captured'];
}

/** Below 140px the icon carries the state and the accessible name carries the words. */
export function isCompact(width: number | string | undefined): boolean {
  return typeof width === 'number' && width < IMAGE_COMPACT_BELOW;
}

/** …and below 88px there is not even room for the label beside the icon. */
export function showsMissingLabel(width: number | string | undefined): boolean {
  return !isCompact(width) || (typeof width === 'number' && width >= IMAGE_LABEL_ABOVE);
}

/** The facts the caption's second line can carry, before any of them is known to be present. */
export interface ImageMetaFacts {
  credit?: string;
  meta?: string;
  referenceOnly: boolean;
  referenceNote: TranslatedText;
  staleAt?: string;
  /** The frame is showing its missing face. */
  missing: boolean;
  words: ImageWords;
}

export interface ImageMetaPart {
  key: string;
  /** One fact of the line — a credit, a date — or words already in the reader's language. */
  text: string;
}

/**
 * The caption's second line, in order, with the absent facts dropped.
 *
 * SHORTFALL REPORTS BEFORE AGE (MS11-11): while the image is missing, `staleAt` is suppressed —
 * "there is no photo" outranks "the photo you're looking at is old", so the line states one fact
 * rather than two competing ones. `referenceOnly` (M05-29) is NOT suppressed in any state.
 */
export function imageMetaParts(facts: ImageMetaFacts): ImageMetaPart[] {
  return [
    { key: 'credit', text: facts.credit },
    { key: 'meta', text: facts.meta },
    { key: 'reference', text: facts.referenceOnly ? facts.referenceNote : undefined },
    {
      key: 'stale',
      text: !facts.missing && facts.staleAt ? facts.words.asOf(facts.staleAt) : undefined,
    },
  ].filter((part): part is ImageMetaPart => Boolean(part.text));
}

/** The missing face, decided once: its look, its words, and what a compact frame leaves out. */
export interface MissingFace {
  tone: ImageMissingSpec['tone'];
  icon: ImageGlyphName;
  compact: boolean;
  /** The words beside the glyph — the caller's, else the reason's own. */
  label: TranslatedText;
  /** The picture's accessible name: the photo's own name with the words, or the words alone. */
  name: TranslatedText;
  glyphSize: number;
  showsLabel: boolean;
  /** The sentence under the mark — none on a compact frame, and `""` draws none. */
  detail: TranslatedText | undefined;
  /** Only a failed fetch offers the retry, and only where there is room for it. */
  offersRetry: boolean;
}

export function missingFaceOf({
  alt,
  width,
  reason,
  missingLabel,
  missingDetail,
  words,
}: Omit<ImageMissingProps, 'onRetry' | 'retryLabel' | 'focusAfter'>): MissingFace {
  const look = missingSpec(reason);
  const said = missingWords(reason, words);
  const compact = isCompact(width);
  const label = missingLabel || said.label;
  const detail = missingDetail ?? said.detail;
  return {
    tone: look.tone,
    icon: look.icon,
    compact,
    label,
    name: alt ? words.missingNamed(alt, label) : label,
    glyphSize: compact ? 20 : 24,
    showsLabel: showsMissingLabel(width),
    detail: !compact && detail ? detail : undefined,
    offersRetry: !compact && reason === 'unavailable',
  };
}
