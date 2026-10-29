import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { DetailPanelProps, DetailPanelSide } from '../DetailPanel/DetailPanel.types';
import type { ModalProps } from '../Modal/Modal.types';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';
import type {
  OverlayStatus,
  OverlaySubtitleFace,
  SheetProps,
  SheetSize,
} from '../Sheet/Sheet.types';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';

/**
 * The **desktop** form. `"panel"` (default) is an edge `DetailPanel` — the editor case, where the
 * record or canvas beside it stays in view. `"modal"` is a centred `Modal` — the decision case
 * (cancel confirm, waive, reversal, typed denial), where nothing is being browsed alongside. The
 * mobile half is the same `Sheet` either way: `F7-21`'s phone answer does not change.
 *
 * `modal={false}` is not honoured under `desktop="modal"` — a decision that must be answered cannot
 * have a live page behind it.
 */
export type EditorDesktopForm = 'panel' | 'modal';

export type EditorSurfaceDensity = 'expressive' | 'functional';

/** What a function child receives — for content that arranges itself around the answer. */
export interface EditorFormContext {
  panel: boolean;
  layerWidth: number;
}

export interface UseEditorFormOptions {
  /** Layer width (px) at or above which the editor is a side panel. Default 720. */
  panelAbove?: number;
  /** Measure inside the nearest positioned ancestor — device frames, specimen cards. */
  inset?: boolean;
}

/**
 * `F7-21`'s **one sheet grammar**, performed rather than described: *"a sheet on mobile, a side
 * panel on desktop — sheets, not pages."*
 *
 * Every editor in the product mounts this instead of picking a form. `Sheet` and `DetailPanel`
 * remain the two forms it renders; reach for them directly only when a surface is one of them by
 * nature.
 */
interface EditorSurfaceOwnProps extends OverlayCloseWords {
  open?: boolean;
  onClose?: () => void;
  /**
   * Layer width (px) at or above which the editor is a side panel. Below it, a bottom sheet.
   * Default 720.
   */
  panelAbove?: number;
  /** The surface's heading: its words, or the record's own name (a person, a lead) the board draws. */
  // biome-ignore lint/plugin/copy-prop-type: a heading may be the record's own name, a fact
  title?: string;
  /** Drawn beside the title, on its line — sheet and panel; a decision's modal draws none. */
  status?: OverlayStatus;
  /** The line under the title — a decision's modal draws it as its description, so it is words. */
  subtitle?: TranslatedText;
  /** The sheet's subtitle face; the panel always sets its subtitle in mono. */
  subtitleFace?: OverlaySubtitleFace;
  overline?: TranslatedText;
  /**
   * The editor's content. A function child receives `{panel, layerWidth}` for content that has to
   * arrange itself around the answer — not to redraw the frame, which is this component's job.
   */
  children?: ReactNode | ((context: EditorFormContext) => ReactNode);
  footer?: ReactNode;
  /**
   * **The non-modal variant** (`modal={false}`) — required by `MS2-31`, `MS3-27`, `MS3-30` and
   * `MS6-19`, where `Slider`'s live `onInput` repaints geometry *behind* the editor. It moves three
   * things together, because they are one decision:
   *
   * - **No backdrop at all** — not a lighter one. The layer behind stays sharp, un-faded and
   *   interactive; separation comes from `e5` and the canvas gap.
   * - **No focus trap** — focus still moves in on open and is restored on close, but Tab reaches
   *   the page, because the page is part of the same task. `role="dialog"` with no `aria-modal`.
   * - **No scroll lock** — only the editor's body scrolls.
   *
   * Esc closes either variant. A non-modal editor may **never** be a decision that must be
   * answered: destructive confirms, waivers, reversals and typed denials stay modal.
   */
  modal?: boolean;
  /** The desktop form — an edge `DetailPanel` for an editor, a centred `Modal` for a decision. */
  desktop?: EditorDesktopForm;
  side?: DetailPanelSide;
  /** Panel width in px when it is a panel. */
  width?: number;
  /** Sheet height when it is a sheet. A non-modal sheet defaults to `half` so its subject stays visible. */
  size?: SheetSize;
  density?: EditorSurfaceDensity;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  emptyTitle?: TranslatedText;
  emptyMessage?: TranslatedText;
  emptyAction?: ReactNode;
  /** No unavailable note is drawn without its title. */
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  unavailableAction?: ReactNode;
  showClose?: boolean;
  dismissible?: boolean;
  /** The title's own mark, before the heading block — both forms (`SCR-M01-14`'s role disc). */
  leading?: ReactNode;
  /**
   * A row under the head that stays in view while the body scrolls — sheet and panel. A function
   * gets the same `{panel, layerWidth}` the body does, for a row the two forms space differently.
   */
  meta?: ReactNode | ((context: EditorFormContext) => ReactNode);
  /** Position inside the nearest positioned ancestor — device frames, specimen cards. The probe follows. */
  inset?: boolean;
  zIndex?: number;
  /** Escape hatch for props only `Sheet` has. The read is the editor's own, never a form's. */
  sheetProps?: Partial<Omit<SheetProps, 'read' | 'loadingLabel'>>;
  /** Escape hatch for props only `DetailPanel` has. The read is the editor's own, never a form's. */
  panelProps?: Partial<Omit<DetailPanelProps, 'read' | 'loadingLabel'>>;
  /** Carries `Modal`'s own chrome — `tone`, `icon`, `size` — for a decision. */
  modalProps?: Partial<ModalProps>;
}

/** An editor of static content: it draws `ready`. */
interface EditorSurfaceStatic {
  read?: undefined;
  loadingLabel?: undefined;
}

/**
 * The system's five (`SurfaceState`), passed straight to whichever form is rendering. An editor is
 * a surface: `unavailable` is the record no market pack covers — neutral, no retry — and it is not
 * `error`, which offers one (law 1).
 */
interface EditorSurfaceReading {
  /** The read this frame shows: `failed` draws the error with its retry; `unavailable` none. */
  read: SurfaceRead;
  /** What is loading, spoken while the read is out. */
  loadingLabel: TranslatedText;
}

export type EditorSurfaceProps = EditorSurfaceOwnProps &
  (EditorSurfaceStatic | EditorSurfaceReading);
