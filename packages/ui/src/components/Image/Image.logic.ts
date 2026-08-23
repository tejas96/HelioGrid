import type { ImageMissingSpec } from './Image.missing';
import { IMAGE_COMPACT_BELOW, IMAGE_LABEL_ABOVE, IMAGE_MISSING } from './Image.missing';
import type { ImageMissingReason, ImageStatus } from './Image.types';

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
  referenceNote: string;
  staleAt?: string;
  /** The frame is showing its missing face. */
  missing: boolean;
}

export interface ImageMetaPart {
  key: string;
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
    { key: 'stale', text: !facts.missing && facts.staleAt ? `As of ${facts.staleAt}` : undefined },
  ].filter((part): part is ImageMetaPart => Boolean(part.text));
}
