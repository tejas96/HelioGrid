import type { ReactNode } from 'react';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';

export type DetailPanelSide = 'right' | 'left';

export type DetailPanelDensity = 'expressive' | 'functional';

export interface DetailPanelProps {
  open?: boolean;
  onClose?: () => void;
  side?: DetailPanelSide;
  /** Panel width in px; caps at 100% of its container. */
  width?: number;
  /**
   * Where the panel's top edge sits, as a token — `var(--header-h)` anchors it under the web
   * header so the header stays usable. The phone half ignores it: a phone draws a `Sheet`.
   */
  top?: string;
  title?: string;
  /** Rendered in Geist Mono — job IDs, coordinates, invoice numbers. */
  subtitle?: string;
  overline?: string;
  /** Leading node in the header, usually an IconCircle or Avatar. */
  leading?: ReactNode;
  /** Node between header and body — a StatusChip row, provenance marker, etc. */
  meta?: ReactNode;
  children?: ReactNode;
  density?: DetailPanelDensity;
  footer?: ReactNode;
  showClose?: boolean;
  dismissible?: boolean;
  /**
   * **Modal by default.** `false` drops backdrop, focus trap and scroll lock together — see
   * `EditorSurface`. The lock is skipped under `inset` too: an inset panel lives in a specimen card
   * or a device frame, not in the document.
   */
  modal?: boolean;
  state?: SurfaceState;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: string;
  /** `empty` means none **yet** — the words invite, and `emptyAction` makes the first one. */
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  /** `unavailable` renders through `UnavailableNote`: neutral, and **no retry, ever**. */
  unavailableTitle?: string;
  unavailableMessage?: string;
  unavailableAction?: ReactNode;
  inset?: boolean;
  zIndex?: number;
}
