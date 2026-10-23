import { useEffect, useState } from 'react';
import {
  type DimensionValue,
  Keyboard,
  type KeyboardEvent,
  Platform,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import type { SheetSize } from './Sheet.types';

/** The sheet's heights as fractions of the window: never above 92%, `half` 56%, `full` the cap. */
export const SHEET_HEIGHT = { cap: 0.92, half: 0.56 } as const;

export function percentOf(fraction: number): DimensionValue {
  return `${Math.round(fraction * 100)}%`;
}

function sizeFraction(size: SheetSize): number | null {
  if (size === 'half') return SHEET_HEIGHT.half;
  return size === 'full' ? SHEET_HEIGHT.cap : null;
}

function liftOf(event: KeyboardEvent | undefined): number {
  return event?.endCoordinates.height ?? 0;
}

/**
 * How far an open sheet rises so the keyboard never covers its field or its act. A sheet draws in a
 * portal, outside the screen's own keyboard avoider, so it lifts itself. iOS lays the keyboard over
 * the window; Android shrinks the window around it, so there nothing rises. Lifted, the sheet keeps
 * its top where it would be without the keyboard at the most — its body scrolls instead of the sheet
 * leaving the screen — and no bottom band is kept, since the keyboard covers the home indicator.
 */
export function useKeyboardLift(
  open: boolean,
  size: SheetSize,
  portalBottomInset: number,
): { readonly panelLift: ViewStyle | undefined; readonly bottomInset: number } {
  const { height: window } = useWindowDimensions();
  const [lift, setLift] = useState(0);
  useEffect(() => {
    if (!open || Platform.OS !== 'ios') return;
    const metrics = Keyboard.metrics();
    setLift(metrics?.height ?? 0);
    const shown = Keyboard.addListener('keyboardWillShow', (event) => setLift(liftOf(event)));
    const hidden = Keyboard.addListener('keyboardWillHide', () => setLift(0));
    return () => {
      shown.remove();
      hidden.remove();
      setLift(0);
    };
  }, [open]);
  if (lift === 0) return { panelLift: undefined, bottomInset: portalBottomInset };
  const room = SHEET_HEIGHT.cap * window - lift;
  const fraction = sizeFraction(size);
  const height = fraction === null ? undefined : Math.min(fraction * window, room);
  return {
    panelLift:
      height === undefined
        ? { bottom: lift, maxHeight: room }
        : { bottom: lift, maxHeight: room, height },
    bottomInset: 0,
  };
}
