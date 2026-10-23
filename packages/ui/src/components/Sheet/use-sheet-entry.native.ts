import { theme } from '@heliogrid/theme';
import { type RefObject, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from '../../primitives/use-reduced-motion';

/**
 * The phone sheet's rise as it opens, once per opening, and whether reduced motion is on — read
 * when a sheet opens or is let go, never as a trigger, so a setting changed while a sheet is open
 * does not send it out and back. Under reduced motion the sheet is in place on its first frame
 * (`F7-51` floor 3).
 */
export function useSheetEntry(
  open: boolean,
  panelHeight: number,
  offset: Animated.Value,
): RefObject<boolean> {
  const reducedMotion = useRef(false);
  reducedMotion.current = useReducedMotion();
  // Rises once per opening: a later change of height — an error line, the keyboard — leaves it be,
  // and the rise is stopped only when the sheet closes, so a height that settles mid-rise never
  // leaves the sheet part-way down.
  const risen = useRef(false);
  const entry = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (!open) {
      risen.current = false;
      entry.current?.stop();
      entry.current = null;
      return;
    }
    if (panelHeight === 0 || risen.current) {
      return;
    }
    risen.current = true;
    if (reducedMotion.current) {
      offset.setValue(0);
      return;
    }
    offset.setValue(panelHeight);
    entry.current = Animated.timing(offset, {
      toValue: 0,
      duration: theme.motion.durations.emphasised,
      easing: Easing.bezier(...theme.motion.easings.spring),
      useNativeDriver: true,
    });
    entry.current.start();
  }, [open, panelHeight, offset]);
  useEffect(() => () => entry.current?.stop(), []);
  return reducedMotion;
}
