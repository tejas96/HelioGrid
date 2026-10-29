import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/** A caller's `error` that draws: any node but `undefined`, `null` or `false`. */
export function hasCallerError(error: ReactNode): boolean {
  return error !== undefined && error !== null && error !== false;
}

/** The danger ring: a refusal just now, the caller's error, or a ring the pair asked for. */
export function isInDanger(
  refused: TranslatedText | null,
  error: ReactNode,
  invalid: boolean,
): boolean {
  return refused !== null || hasCallerError(error) || invalid;
}

/** A window's two boxes are ringed together, by the caller's error or the pair's own refusal. */
export function isPairRinged(error: ReactNode, orderError: TranslatedText | null): boolean {
  return hasCallerError(error) || orderError !== null;
}
