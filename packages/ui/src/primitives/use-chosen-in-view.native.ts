import { theme } from '@heliogrid/theme';
import { useEffect, useRef } from 'react';
import type { LayoutChangeEvent, ScrollView } from 'react-native';
import { useReducedMotion } from './use-reduced-motion.native';

/** How far before the chosen tab the strip stops, so the tab before it still shows as a cue. */
const SCROLL_LEAD = theme.spacing['sp-8'];

/**
 * A sideways strip of tabs keeps its chosen tab in view — on a tap, and on a move made elsewhere
 * (Next, Back): a strip wider than the phone hid the chosen tab behind the screen's edge with no
 * cue that more were there. Each tab's holder reports where it starts through `placed(key)`.
 */
export function useChosenInView<Key>(chosen: Key): {
  strip: React.RefObject<ScrollView | null>;
  placed: (key: Key) => (event: LayoutChangeEvent) => void;
} {
  const strip = useRef<ScrollView>(null);
  const starts = useRef(new Map<Key, number>());
  const reduced = useReducedMotion();
  const show = (x: number) =>
    strip.current?.scrollTo({ x: Math.max(0, x - SCROLL_LEAD), animated: !reduced });
  // biome-ignore lint/correctness/useExhaustiveDependencies: moves only when the chosen tab does
  useEffect(() => {
    const x = starts.current.get(chosen);
    if (x !== undefined) show(x);
  }, [chosen]);
  return {
    strip,
    placed: (key) => (event) => {
      const x = event.nativeEvent.layout.x;
      starts.current.set(key, x);
      if (key === chosen) show(x);
    },
  };
}
