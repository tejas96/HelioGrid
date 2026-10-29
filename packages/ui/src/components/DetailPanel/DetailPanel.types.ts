import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';
import type { OverlayStatus, OverlaySubtitleFace } from '../Sheet/Sheet.types';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';

export type DetailPanelSide = 'right' | 'left';

export type DetailPanelDensity = 'expressive' | 'functional';

interface DetailPanelOwnProps extends OverlayCloseWords {
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
  /** The surface's heading: its words, or the record's own name (a person, a lead) the board draws. */
  // biome-ignore lint/plugin/copy-prop-type: a heading may be the record's own name, a fact
  title?: string;
  /** Drawn beside the title, on its line. */
  status?: OverlayStatus;
  /** Rendered in Geist Mono — job IDs, coordinates, invoice numbers — unless `subtitleFace` is `sans`. */
  // biome-ignore lint/plugin/copy-prop-type: a fact — a job id, coordinates, an invoice number — or words
  subtitle?: string;
  /** `sans` for a subtitle of words (*Starts from version 7*), as `Sheet` takes it. Default `mono`. */
  subtitleFace?: OverlaySubtitleFace;
  overline?: TranslatedText;
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
  /** Name what failed — a generic panel cannot know, so the caller says. */
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /** `empty` means none **yet** — the words invite, and `emptyAction` makes the first one. */
  emptyTitle?: TranslatedText;
  emptyMessage?: TranslatedText;
  emptyAction?: ReactNode;
  /** `unavailable` renders through `UnavailableNote` — no note without its title — and no retry. */
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  unavailableAction?: ReactNode;
  inset?: boolean;
  zIndex?: number;
}

/** A panel of static content: it draws `ready`. */
interface DetailPanelStatic {
  read?: undefined;
  loadingLabel?: undefined;
}

/** A panel that shows a read: `failed` draws the error with its retry; `unavailable` draws none. */
interface DetailPanelReading {
  /** The read this frame shows. */
  read: SurfaceRead;
  /** What is loading, spoken while the read is out. */
  loadingLabel: TranslatedText;
}

export type DetailPanelProps = DetailPanelOwnProps & (DetailPanelStatic | DetailPanelReading);
