import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { SheetSize } from '../Sheet/Sheet.types';
import type {
  EditorDesktopForm,
  EditorFormContext,
  EditorSurfaceDensity,
  EditorSurfaceProps,
} from './EditorSurface.types';
import { type EditorStateProps, editorStateProps } from './editor-state-props';

/** The default `panelAbove`: at or above this many px of LAYER width the editor is a side panel. */
export const PANEL_ABOVE = 720;

export interface EditorFormChrome {
  closeLabel: TranslatedText;
  density: EditorSurfaceDensity;
  showClose: boolean;
}

/** A panel has room for a close button and defaults to the dense working set: it sits on data. */
export function panelChrome(props: EditorSurfaceProps): EditorFormChrome {
  return {
    closeLabel: props.closeLabel,
    density: props.density ?? 'functional',
    showClose: props.showClose ?? true,
  };
}

/** A decision is always dismissible by its own actions, and always offers the close. */
export function modalChrome(props: EditorSurfaceProps): EditorFormChrome {
  return {
    closeLabel: props.closeLabel,
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
    closeLabel: props.closeLabel,
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
 * A function body or meta row receives the answer — for content that arranges itself around it (two
 * columns in a panel, one in a sheet; a line spaced closer in a panel). It never redraws the frame;
 * that is the component's own job.
 */
export function resolveForForm(
  children: EditorSurfaceProps['children'] | EditorSurfaceProps['meta'],
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

/** What every form says and how it closes — the same defaults whichever form renders. */
function sharedFormProps(props: EditorSurfaceProps) {
  return {
    dismissible: props.dismissible ?? true,
    footer: props.footer,
    onClose: props.onClose,
    open: true,
    overline: props.overline,
    title: props.title,
    zIndex: props.zIndex ?? 40,
  };
}

/** The head and its states, which a sheet and a panel take alike and a decision's modal never does. */
function headFormProps(props: EditorSurfaceProps, meta: ReactNode) {
  return {
    ...sharedFormProps(props),
    leading: props.leading ?? null,
    meta,
    modal: props.modal ?? true,
    status: props.status,
    subtitle: props.subtitle,
    subtitleFace: props.subtitleFace,
  };
}

/** The decision's `Modal`: its subtitle is spoken as the modal's description. */
export function modalFormProps(props: EditorSurfaceProps) {
  return { ...modalChrome(props), ...sharedFormProps(props), description: props.subtitle };
}

/** The edge `DetailPanel` — `meta` is the row already resolved for the panel form. */
export function panelFormProps(props: EditorSurfaceProps, meta: ReactNode) {
  const stateProps: EditorStateProps = editorStateProps(props);
  return {
    ...stateProps,
    ...panelChrome(props),
    ...headFormProps(props, meta),
    side: props.side ?? 'right',
    width: props.width ?? 480,
  };
}

/** The bottom `Sheet` — `meta` is the row already resolved for the sheet form. */
export function sheetFormProps(props: EditorSurfaceProps, meta: ReactNode) {
  const stateProps: EditorStateProps = editorStateProps(props);
  return { ...stateProps, ...sheetChrome(props), ...headFormProps(props, meta) };
}
