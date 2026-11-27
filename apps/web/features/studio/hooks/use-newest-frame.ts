import { useMemo, useRef } from 'react';

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

/**
 * A roof's sheet, Roofs or the picker frames the roofs above it: again once its room is measured,
 * as it is taller than the bar it replaces. While an arrow on the model is held the sheet steps
 * aside and the roof changes under the finger: the frame waits, and comes once as it is let go.
 */
export function useSheetFraming(
  panelUp: boolean,
  sheetFrame: object | null,
  roomBottom: number,
  arrowHeld: boolean,
): object | null {
  const held = useRef<object | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the measured room and the arrow let go are what ask for a new frame
  const framing = useMemo(
    () => (arrowHeld ? held.current : panelUp ? {} : null),
    [panelUp, sheetFrame, roomBottom, arrowHeld],
  );
  held.current = framing;
  return framing;
}
