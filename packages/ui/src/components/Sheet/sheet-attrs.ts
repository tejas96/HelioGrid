import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';
import type { SheetDensity, SheetSize } from './Sheet.types';

/** A flag reaches the stylesheet as a STRING — `[data-x="true"]` is what the sheet's CSS matches on. */
export type BoolAttr = 'true' | 'false';

export interface SheetPanelAttrs {
  'data-density': SheetDensity;
  /** Mid-drag the entry animation stands aside, or it restarts under the finger. */
  'data-dragged': BoolAttr;
  /** While a finger owns the transform the transition stands aside too. */
  'data-dragging': BoolAttr;
  'data-inset': BoolAttr;
  /** The body has left its top: the rows fade under the head, and a tucking title goes up. */
  'data-scrolled': BoolAttr;
  'data-size': SheetSize;
  /** The title tucks into the handle's row as the body scrolls (`sheetTucks`). */
  'data-tucks': BoolAttr;
}

export interface SheetBodyAttrs {
  /** A footer below shortens the body's bottom padding; the fade does the separating. */
  'data-footer': BoolAttr;
  /** A header above removes the body's own top padding. */
  'data-header': BoolAttr;
  /** A held body does not scroll; its content scrolls its own part. */
  'data-held': BoolAttr;
}

export interface SheetPanelState {
  density: SheetDensity;
  dragY: number;
  dragging: boolean;
  inset: boolean;
  scrolled: boolean;
  size: SheetSize;
  tucks: boolean;
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
  scrolled,
  size,
  tucks,
}: SheetPanelState): SheetPanelAttrs {
  return {
    'data-density': density,
    'data-dragged': dragY > 0 ? 'true' : 'false',
    'data-dragging': dragging ? 'true' : 'false',
    'data-inset': inset ? 'true' : 'false',
    'data-scrolled': scrolled ? 'true' : 'false',
    'data-size': size,
    'data-tucks': tucks ? 'true' : 'false',
  };
}

/** The body's three — whether a header sits above it, a footer below it, and whether it scrolls. */
export function sheetBodyAttrs(
  hasHeader: boolean,
  hasFooter: boolean,
  scrolls: boolean,
): SheetBodyAttrs {
  return {
    'data-footer': hasFooter ? 'true' : 'false',
    'data-header': hasHeader ? 'true' : 'false',
    'data-held': scrolls ? 'false' : 'true',
  };
}

/**
 * An overlay that shows a read is where focus lands once its *Try again* has gone, so it shows the
 * ring a control does; one of static content takes focus only as it opens, and shows none.
 */
export function readFrameClass(read: SurfaceRead | undefined): string | undefined {
  return read === undefined ? undefined : 'hg-focus-target';
}
