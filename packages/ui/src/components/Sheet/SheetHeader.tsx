import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';
import { StatusChip } from '../StatusChip/StatusChip';
import { OverlayClose } from './OverlayClose';
import type { OverlayStatus, OverlaySubtitleFace } from './Sheet.types';

interface SheetHeaderProps {
  /** The title's own mark, before the heading block; nothing is drawn for it when absent. */
  leading?: ReactNode;
  /** With a handle above it the header loses its own top padding. */
  handle: boolean;
  closeLabel: TranslatedText;
  onClose?: () => void;
  /** Without a handle the header becomes the drag target, exactly as the reference does. */
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  overline?: TranslatedText;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  status?: OverlayStatus;
  subtitle?: string;
  subtitleFace: OverlaySubtitleFace;
  title?: string;
  titleId: string;
}

/** The sheet's sticky header: overline, title, subtitle and the 44×44 dismissal. */
export function SheetHeader({
  leading,
  handle,
  closeLabel,
  onClose,
  onPointerDown,
  overline,
  scrolled,
  showClose,
  status,
  subtitle,
  subtitleFace,
  title,
  titleId,
}: SheetHeaderProps) {
  return (
    /* Without a handle this row becomes the drag target, exactly as the reference does. Every act
       it carries also has a keyboard route — Esc, the backdrop, the close button. */
    <div
      className="hg-sheet-header"
      data-handle={handle ? 'true' : 'false'}
      data-scrolled={scrolled ? 'true' : 'false'}
      onPointerDown={onPointerDown}
    >
      <Lead leading={leading}>
        <div className="hg-sheet-heading">
          {overline === undefined ? null : <div className="hg-sheet-overline">{overline}</div>}
          {title === undefined ? null : (
            <div className="hg-overlay-title-line">
              <h2 className="hg-sheet-title" id={titleId}>
                {title}
              </h2>
              {status === undefined ? null : (
                <StatusChip
                  status={status.label}
                  label={status.label}
                  tone={status.tone}
                  density="functional"
                />
              )}
            </div>
          )}
          {subtitle === undefined ? null : (
            <div className="hg-sheet-subtitle" data-face={subtitleFace}>
              {subtitle}
            </div>
          )}
        </div>
      </Lead>
      {showClose ? (
        <OverlayClose label={closeLabel} offset={handle ? 'handle' : 'sheet'} onClick={onClose} />
      ) : null}
    </div>
  );
}

/** The mark and the heading side by side — only when there is a mark, so no empty box is drawn. */
function Lead({ leading, children }: { leading: ReactNode; children: ReactNode }) {
  if (leading === undefined || leading === null) return children;
  return (
    <div className="hg-sheet-lead">
      {leading}
      {children}
    </div>
  );
}
