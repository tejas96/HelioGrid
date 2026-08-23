import type { ReactNode } from 'react';
import type { SheetSize } from '../Sheet/Sheet.types';
import type {
  EditorDesktopForm,
  EditorFormContext,
  EditorSurfaceDensity,
  EditorSurfaceProps,
} from './EditorSurface.types';

/** The default `panelAbove`: at or above this many px of LAYER width the editor is a side panel. */
export const PANEL_ABOVE = 720;

export interface EditorFormChrome {
  density: EditorSurfaceDensity;
  showClose: boolean;
}

/** A panel has room for a close button and defaults to the dense working set: it sits on data. */
export function panelChrome(props: EditorSurfaceProps): EditorFormChrome {
  return {
    density: props.density ?? 'functional',
    showClose: props.showClose ?? true,
  };
}

/** A decision is always dismissible by its own actions, and always offers the close. */
export function modalChrome(props: EditorSurfaceProps): EditorFormChrome {
  return {
    density: props.density ?? 'expressive',
    showClose: props.showClose ?? true,
  };
}

export interface SheetFormChrome extends EditorFormChrome {
  size: SheetSize;
}

/**
 * The sheet half's two conditional defaults, and both hang off `modal`:
 *
 * · **The handle is enough on a modal sheet**, so the close button stays off unless asked for. A
 *   NON-modal one has no backdrop to tap, so the named dismissal appears by default.
 * · **A non-modal sheet defaults to `half`**, because the whole reason to open one is that its
 *   subject is the live surface behind it — `auto` could hug its way over the thing being edited.
 */
export function sheetChrome(props: EditorSurfaceProps): SheetFormChrome {
  const modal = props.modal !== false;
  return {
    density: props.density ?? 'expressive',
    showClose: props.showClose ?? !modal,
    size: props.size ?? (modal ? 'auto' : 'half'),
  };
}

/**
 * Which form the editor takes. `null` until the first measurement — nothing renders before then,
 * so the editor is never drawn in the wrong form and swapped.
 */
export function isPanel(layerWidth: number | null, panelAbove: number): boolean | null {
  return layerWidth === null ? null : layerWidth >= panelAbove;
}

/** True when the desktop half is a centred decision rather than an edge drawer. */
export function isDecision(panel: boolean, desktop: EditorDesktopForm): boolean {
  return panel && desktop === 'modal';
}

/**
 * A function child receives the answer — for content that arranges itself around it (two columns
 * in a panel, one in a sheet). It never redraws the frame; that is the component's own job.
 */
export function resolveEditorBody(
  children: EditorSurfaceProps['children'],
  panel: boolean | null,
  layerWidth: number | null,
): ReactNode {
  if (typeof children !== 'function') {
    return children;
  }
  if (panel === null || layerWidth === null) {
    return null;
  }
  const context: EditorFormContext = { panel, layerWidth };
  return children(context);
}
