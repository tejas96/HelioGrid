import type { SheetDensity, SheetSize } from './Sheet.types';

/** A flag reaches the stylesheet as a STRING — `[data-x="true"]` is what Sheet.css matches on. */
export type BoolAttr = 'true' | 'false';

export interface SheetPanelAttrs {
  'data-density': SheetDensity;
  /** Mid-drag the entry animation stands aside, or it restarts under the finger. */
  'data-dragged': BoolAttr;
  /** While a finger owns the transform the transition stands aside too. */
  'data-dragging': BoolAttr;
  'data-inset': BoolAttr;
  'data-size': SheetSize;
}

export interface SheetBodyAttrs {
  /** A footer below shortens the body's bottom padding; the fade does the separating. */
  'data-footer': BoolAttr;
  /** A header above removes the body's own top padding. */
  'data-header': BoolAttr;
}

export interface SheetPanelState {
  density: SheetDensity;
  dragY: number;
  dragging: boolean;
  inset: boolean;
  size: SheetSize;
}

/**
 * The `data-*` vocabulary the panel publishes to Sheet.css, in ONE declaration — markup and
 * stylesheet read the same list, so a state cannot be styled that the panel never sets.
 */
export function sheetPanelAttrs({
  density,
  dragY,
  dragging,
  inset,
  size,
}: SheetPanelState): SheetPanelAttrs {
  return {
    'data-density': density,
    'data-dragged': dragY > 0 ? 'true' : 'false',
    'data-dragging': dragging ? 'true' : 'false',
    'data-inset': inset ? 'true' : 'false',
    'data-size': size,
  };
}

/** The body's two — whether a header sits above it and whether a footer sits below it. */
export function sheetBodyAttrs(hasHeader: boolean, hasFooter: boolean): SheetBodyAttrs {
  return {
    'data-footer': hasFooter ? 'true' : 'false',
    'data-header': hasHeader ? 'true' : 'false',
  };
}
