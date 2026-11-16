import type { RefObject } from 'react';
import { useEffect, useState } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';
import { Dimensions } from 'react-native';
import { type LayerTarget, useMeasureForLayer } from '../../primitives/Portal/Portal.native';
import {
  boxKey,
  boxNode,
  type ExplainerDensity,
  type ExplainerRect,
  explainerCap,
  type PlacedExplainer,
  placeCapped,
} from './Explainer.logic';
import type { ExplainerBox, ExplainerPlacement } from './Explainer.types';

/**
 * A ref, a view instance or a function returning one. A CSS selector has no native meaning, so it
 * resolves to the window.
 */
function measurableOf(box: ExplainerBox | undefined): LayerTarget | null {
  if (box === undefined || typeof box === 'string') return null;
  const node = boxNode(box);
  return typeof node === 'object' && node !== null && 'measureInWindow' in node
    ? (node as LayerTarget)
    : null;
}

/** A box where it rests, as the bubble's rectangle (`useMeasureForLayer`). */
function rectOf(
  measureFor: ReturnType<typeof useMeasureForLayer>,
  node: LayerTarget | null,
): Promise<ExplainerRect | null> {
  return new Promise((resolve) => {
    if (node === null) return resolve(null);
    measureFor(node, ({ x, y, w, h }) => resolve({ left: x, top: y, right: x + w, bottom: y + h }));
  });
}

interface PlaceInput {
  isOpen: boolean;
  /** The page on show: a page of another height is measured again. */
  content: unknown;
  trigger: RefObject<View | null>;
  within?: ExplainerBox;
  placement: ExplainerPlacement;
  density: ExplainerDensity;
  maxWidth?: number;
}

/**
 * Where the bubble goes in window coordinates, by the web half's rules: the trigger and the box are
 * measured where they rest (`useMeasureForLayer`), the bubble by its own layout. `placed` is null until all three
 * are known, so the first frame never shows the bubble in the wrong place.
 */
export function useExplainerPlace({
  isOpen,
  content,
  trigger,
  within,
  placement,
  density,
  maxWidth,
}: PlaceInput) {
  const [anchor, setAnchor] = useState<{ from: ExplainerRect; bounds: ExplainerRect } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const measureFor = useMeasureForLayer();
  const box = boxKey(within);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `content` re-measures when a page of another height arrives; `trigger` is a ref; `box` stands for `within`.
  useEffect(() => {
    if (!isOpen) {
      setAnchor(null);
      setSize(null);
      return;
    }
    let live = true;
    void Promise.all([
      rectOf(measureFor, measurableOf(trigger)),
      rectOf(measureFor, measurableOf(within)),
    ]).then(([from, box]) => {
      const screen = Dimensions.get('window');
      const bounds = box ?? { left: 0, top: 0, right: screen.width, bottom: screen.height };
      if (live && from !== null) setAnchor({ from, bounds });
    });
    return () => {
      live = false;
    };
  }, [isOpen, content, box]);

  const cap = anchor === null ? null : explainerCap(anchor.bounds, density, maxWidth);
  const placed: PlacedExplainer | null =
    anchor === null || size === null || cap === null
      ? null
      : placeCapped(anchor.from, anchor.bounds, size, cap, placement, density);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((before) =>
      before !== null && before.width === width && before.height === height
        ? before
        : { width, height },
    );
  };

  return { placed, cap, onLayout };
}
