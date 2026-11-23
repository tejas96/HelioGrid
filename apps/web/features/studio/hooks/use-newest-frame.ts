import { useRef } from 'react';

/**
 * The frame the camera answers now: the newest ask of the ones given — a roof closed, a sheet
 * opened, typing, a picture landed — so a later ask always wins over an older one still standing.
 * When the newest clears, the first still standing in the order given takes over.
 */
export function useNewestFrame(asks: readonly (object | null)[]): object | null {
  const before = useRef<readonly (object | null)[]>([]);
  const current = useRef<object | null>(null);
  const fresh = asks.find((ask, i) => ask !== null && ask !== before.current[i]);
  if (fresh !== undefined) current.current = fresh;
  else if (current.current === null || !asks.includes(current.current)) {
    current.current = asks.find((ask) => ask !== null) ?? null;
  }
  before.current = asks;
  return current.current;
}
