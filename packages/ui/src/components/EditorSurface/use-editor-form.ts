/* This half is the WEB half and it reaches for real DOM globals. Sibling components import
   overlay barrels rather than `.native` paths, which drags this file into the native tsconfig's
   program, so it declares the lib it needs instead of failing there. */
/// <reference lib="dom" />
import type { CSSProperties, RefObject } from 'react';
import { useBoxWidth } from '../../primitives/use-box-width';
import type { UseEditorFormOptions } from './EditorSurface.types';
import { isPanel, PANEL_ABOVE } from './editor-form-props';

export interface EditorFormAnswer {
  ref: RefObject<HTMLDivElement | null>;
  layerWidth: number | null;
  /** `null` until the first measurement — nothing renders in the wrong form and swaps. */
  panel: boolean | null;
  probeStyle: CSSProperties;
}

/**
 * THE MEASUREMENT IS THE WIDTH OF THE LAYER THE EDITOR MOUNTS INTO, never `window.innerWidth`.
 *
 * A zero-height probe is positioned in exactly the coordinate space the overlay will use — `fixed`
 * for a real overlay, `absolute` under `inset` (a device frame or a specimen card) — and its width
 * is the space the editor actually has. So a 375px phone frame sitting on a 1440px desktop gets
 * the sheet, which `window.innerWidth` would have got wrong, and the rule reads the same as the
 * rest of the system: own width, not viewport.
 */
export function useLayerWidth(): [RefObject<HTMLDivElement | null>, number | null] {
  return useBoxWidth<HTMLDivElement>();
}

export function probeStyleFor(inset: boolean): CSSProperties {
  return {
    position: inset ? 'absolute' : 'fixed',
    left: 0,
    right: 0,
    top: 0,
    height: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
  };
}

/**
 * The switch alone, for a surface that arranges its own content around the answer (a filter body
 * that wants two columns in a panel and one in a sheet). Spread `probeStyle` on a zero-height
 * `<div ref={ref}>` in the layer being measured; `panel` is `null` until the first measurement.
 */
export function useEditorForm({
  panelAbove = PANEL_ABOVE,
  inset = false,
}: UseEditorFormOptions = {}): EditorFormAnswer {
  const [ref, layerWidth] = useLayerWidth();
  return {
    ref,
    layerWidth,
    panel: isPanel(layerWidth, panelAbove),
    probeStyle: probeStyleFor(inset),
  };
}
