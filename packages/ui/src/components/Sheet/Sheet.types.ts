import type { ReactNode } from 'react';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';

/** auto = hugs content (max 92%); half = 56%; full = 92%. */
export type SheetSize = 'auto' | 'half' | 'full';

/** Expressive = the 32px sheet radius and roomy padding; functional = 16px and tighter. */
export type SheetDensity = 'expressive' | 'functional';

export interface SheetProps {
  open?: boolean;
  /** Called on backdrop click, Esc, close button and drag-past-threshold. */
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  /** Uppercase micro-label above the title ("SITE SURVEY"). */
  overline?: string;
  children?: ReactNode;
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
  /** Sticky footer. Gets a luminance fade above it, never a divider line. */
  footer?: ReactNode;
  state?: SurfaceState;
  /** Name what failed. The default claims nothing, because a generic overlay cannot know. */
  errorTitle?: string;
  /**
   * State the problem and the fix — and never assert a cause the surface can't verify
   * ("The phone has no signal" on what was really a 500 is a lie the user acts on).
   */
  errorMessage?: string;
  onRetry?: () => void;
  /** `empty` means none **yet**, so these words invite — and `emptyAction` makes the first one. */
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  /** `unavailable` renders through `UnavailableNote`: neutral words, and **no retry, ever**. */
  unavailableTitle?: string;
  unavailableMessage?: string;
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
