import { type RefObject, useRef } from 'react';

/**
 * The phone measures a part's room with `onLayout` where it needs it; this hook answers nothing, so
 * a shared caller falls back to its narrow form.
 */
export function useOwnWidth<T = unknown>(): readonly [RefObject<T | null>, number | null] {
  return [useRef<T>(null), null] as const;
}
