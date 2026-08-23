import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, View, ViewStyle } from 'react-native';
import { Dimensions } from 'react-native';
import type { UseEditorFormOptions } from './EditorSurface.types';

export interface EditorFormAnswer {
  ref: React.RefObject<View | null>;
  layerWidth: number | null;
  /** `null` until the first measurement — nothing renders in the wrong form and swaps. */
  panel: boolean | null;
  probeStyle: ViewStyle;
  /** RN measures by layout, not by observer: hand this to the probe `View`. */
  onLayout: (event: LayoutChangeEvent) => void;
}

export interface LayerWidth {
  onLayout: (event: LayoutChangeEvent) => void;
  width: number | null;
}

/**
 * THE MEASUREMENT IS THE WIDTH OF THE LAYER THE EDITOR MOUNTS INTO.
 *
 * WEB→TOUCH MAPPING: the web half puts a `position: fixed` probe in the overlay's own coordinate
 * space and watches it with a `ResizeObserver`. RN has no fixed positioning — a non-inset overlay
 * lands in the Portal host, whose coordinate space IS the window — so the layer width for the
 * ordinary case is the window width, tracked through `Dimensions`. Under `inset` the probe is a
 * real zero-height `View` in the ancestor being measured, read through `onLayout`, which is the
 * same "own width, not viewport" rule the web half enforces.
 */
export function useLayerWidth(inset: boolean): LayerWidth {
  const [measured, setMeasured] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(() => Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  return {
    onLayout: (event: LayoutChangeEvent) => setMeasured(event.nativeEvent.layout.width),
    width: inset ? measured : windowWidth,
  };
}

export const PROBE_STYLE: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: 0,
  opacity: 0,
};

/**
 * The switch alone, for a surface that arranges its own content around the answer (a filter body
 * that wants two columns in a panel and one in a sheet). Put `probeStyle` and `onLayout` on a
 * zero-height `<View ref={ref}>` in the layer being measured; `panel` is `null` until the first
 * measurement.
 */
export function useEditorForm({
  panelAbove = 720,
  inset = false,
}: UseEditorFormOptions = {}): EditorFormAnswer {
  const ref = useRef<View>(null);
  const { onLayout, width } = useLayerWidth(inset);
  return {
    ref,
    layerWidth: width,
    panel: width === null ? null : width >= panelAbove,
    probeStyle: PROBE_STYLE,
    onLayout,
  };
}
