import type { PointerEvent as ReactPointerEvent } from 'react';
import { OverlayClose } from './OverlayClose';

interface SheetHeaderProps {
  /** With a handle above it the header loses its own top padding. */
  handle: boolean;
  onClose?: () => void;
  /** Without a handle the header becomes the drag target, exactly as the reference does. */
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  overline?: string;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  subtitle?: string;
  title?: string;
  titleId: string;
}

/** The sheet's sticky header: overline, title, subtitle and the 44×44 dismissal. */
export function SheetHeader({
  handle,
  onClose,
  onPointerDown,
  overline,
  scrolled,
  showClose,
  subtitle,
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
      <div className="hg-sheet-heading">
        {overline === undefined ? null : <div className="hg-sheet-overline">{overline}</div>}
        {title === undefined ? null : (
          <h2 className="hg-sheet-title" id={titleId}>
            {title}
          </h2>
        )}
        {subtitle === undefined ? null : <div className="hg-sheet-subtitle">{subtitle}</div>}
      </div>
      {showClose ? <OverlayClose offset="sheet" onClick={onClose} /> : null}
    </div>
  );
}
