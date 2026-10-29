import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { StatusTone } from '../../primitives/StatusMark';
import type { SurfaceRead, SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type { OverlayCloseWords } from './OverlayClose.types';

/** auto = hugs content (max 92%); half = 56%; full = 92%. */
export type SheetSize = 'auto' | 'half' | 'full';

/** Expressive = the 32px sheet radius and roomy padding; functional = 16px and tighter. */
export type SheetDensity = 'expressive' | 'functional';

/** A status beside an overlay's title — the person's *Active* on Assign Roles (`SCR-M01-13`). */
export interface OverlayStatus {
  readonly label: TranslatedText;
  readonly tone: StatusTone;
}

/** The face of the line under the title: `mono` when it carries a number (`F7-09`). */
export type OverlaySubtitleFace = 'sans' | 'mono';

interface SheetOwnProps extends OverlayCloseWords {
  open?: boolean;
  /** Called on backdrop click, Esc, close button and drag-past-threshold. */
  onClose?: () => void;
  /** The surface's heading: its words, or the record's own name (a person, a lead) the board draws. */
  // biome-ignore lint/plugin/copy-prop-type: a heading may be the record's own name, a fact
  title?: string;
  /** Drawn beside the title, on its line. */
  status?: OverlayStatus;
  // biome-ignore lint/plugin/copy-prop-type: a fact as often as words — a phone set in mono (F7-09)
  subtitle?: string;
  /** `sans` by default; `mono` for a number such as a phone (`F7-09`). */
  subtitleFace?: OverlaySubtitleFace;
  /**
   * Drawn before the heading block, the title's own mark — a role's disc (`SCR-M01-14`). The same
   * slot as `DetailPanel`'s `leading`.
   */
  leading?: ReactNode;
  /** Uppercase micro-label above the title ("SITE SURVEY"). */
  overline?: TranslatedText;
  children?: ReactNode;
  /**
   * A row between the header and the scrolling body that stays in view while the body scrolls —
   * a list's filter bar. The same slot as `DetailPanel`'s `meta`.
   */
  meta?: ReactNode;
  /** auto = hugs content (max 92%); half = 56%; full = 92%. */
  size?: SheetSize;
  density?: SheetDensity;
  /** 36x4 grab handle. Also the drag target. */
  handle?: boolean;
  /** 44x44 close button in the header. Handle is enough on mobile; use on desktop/tablet. */
  showClose?: boolean;
  /** false = must resolve via an action (destructive confirms, required steps). */
  dismissible?: boolean;
  /**
   * **Modal by default.** `false` drops the backdrop, the focus trap and the scroll lock together —
   * the three are one decision. Use it only through `EditorSurface`, whose docs carry the rule:
   * a non-modal editor is for editors whose subject is the live surface behind them (`MS3-27`'s
   * setback ring), never for a decision that must be answered.
   */
  modal?: boolean;
  dragToDismiss?: boolean;
  /**
   * `false`: the body does not scroll — its content bounds itself and scrolls its own part, so a
   * head inside it stays in view (`SCR-M01-10`'s role card, `m-reopened`). Default `true`.
   */
  bodyScrolls?: boolean;
  /** Sticky footer. Gets a luminance fade above it, never a divider line. */
  footer?: ReactNode;
  /** Name what failed — a generic overlay cannot know, so the caller says. */
  errorTitle?: TranslatedText;
  /**
   * State the problem and the fix — and never assert a cause the surface can't verify
   * ("The phone has no signal" on what was really a 500 is a lie the user acts on).
   */
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /** `empty` means none **yet**, so these words invite — and `emptyAction` makes the first one. */
  emptyTitle?: TranslatedText;
  emptyMessage?: TranslatedText;
  emptyAction?: ReactNode;
  /** `unavailable` renders through `UnavailableNote` — no note without its title — and no retry. */
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  /** One **forward** act, never a retry. */
  unavailableAction?: ReactNode;
  /** Position absolutely inside the nearest positioned ancestor (device frames, specimen cards). */
  inset?: boolean;
  zIndex?: number;
  /**
   * The id of a heading the CALLER rendered. A dialog must have an accessible name, and a caller
   * whose header is its own — an icon header, a composed title row — has no `title` to be named by.
   */
  labelId?: string;
}

/** A sheet of static content: it draws `ready`. */
interface SheetStatic {
  read?: undefined;
  loadingLabel?: undefined;
}

/** A sheet that shows a read: `failed` draws the error with its retry; `unavailable` draws none. */
interface SheetReading {
  /** The read this frame shows. */
  read: SurfaceRead;
  /** What is loading, spoken while the read is out. */
  loadingLabel: TranslatedText;
}

export type SheetProps = SheetOwnProps & (SheetStatic | SheetReading);

export interface SheetBackdropProps {
  onClick?: () => void;
  inset?: boolean;
  zIndex?: number;
}

/** What `SheetActions` publishes whenever its own-width answer changes. */
export interface SheetActionsForm {
  stacked: boolean;
  width: number;
}

export interface SheetActionsProps {
  children?: ReactNode;
  /** Own-width threshold (px) below which actions stack full-width, primary on top. */
  stackBelow?: number;
  /**
   * **The breakpoint this row owns, published** (law 4) — fires with `{stacked, width}` whenever the
   * answer changes. Same callback shape as `Kanban.onFormChange` and `DataTable.onFormChange`.
   */
  onFormChange?: (form: SheetActionsForm) => void;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** `sheet` bodies are 280px wide and 28/24 padded; `panel` bodies 300px and 48 padded. */
export type OverlayStateVariant = 'sheet' | 'panel';

export interface OverlayEmptyProps {
  title?: TranslatedText;
  message?: TranslatedText;
  action?: ReactNode;
  variant: OverlayStateVariant;
}

export interface OverlayErrorProps {
  title?: TranslatedText;
  message?: TranslatedText;
  onRetry?: () => void;
  variant: OverlayStateVariant;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /** The overlay's own frame, which stays while it reloads: focus lands there once the retry goes. */
  focusAfter: FocusAfter;
}

/** What `OverlayBody` takes on both platforms; each half adds how it pads `unavailable`. */
export interface OverlayBodyStateProps {
  children?: ReactNode;
  emptyAction?: ReactNode;
  emptyMessage?: TranslatedText;
  emptyTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  errorTitle?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** The overlay's own frame, which stays while it reloads: focus lands there once a retry goes. */
  focusAfter: FocusAfter;
  /** The surface's own `loading` shape — a sheet's bars are not a panel's. */
  skeleton: ReactNode;
  state: SurfaceState;
  unavailableAction?: ReactNode;
  unavailableMessage?: TranslatedText;
  unavailableTitle?: TranslatedText;
  variant: OverlayStateVariant;
}
