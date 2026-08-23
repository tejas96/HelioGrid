import type { ReactNode } from 'react';
import { OverlayClose } from '../Sheet/OverlayClose';

interface PanelHeaderProps {
  /** Leading node, usually an IconCircle or Avatar. */
  leading?: ReactNode;
  onClose?: () => void;
  overline?: string;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  /** Rendered in Geist Mono — job IDs, coordinates, invoice numbers. */
  subtitle?: string;
  title?: string;
  titleId: string;
}

/** The panel's sticky header: a leading node, the heading block and the 44×44 dismissal. */
export function PanelHeader({
  leading,
  onClose,
  overline,
  scrolled,
  showClose,
  subtitle,
  title,
  titleId,
}: PanelHeaderProps) {
  return (
    <div className="hg-detail-panel-header" data-scrolled={scrolled ? 'true' : 'false'}>
      <div className="hg-detail-panel-lead">
        {leading}
        <div className="hg-detail-panel-heading">
          {overline === undefined ? null : (
            <div className="hg-detail-panel-overline">{overline}</div>
          )}
          {title === undefined ? null : (
            <h2 className="hg-detail-panel-title" id={titleId}>
              {title}
            </h2>
          )}
          {subtitle === undefined ? null : (
            <div className="hg-detail-panel-subtitle">{subtitle}</div>
          )}
        </div>
      </div>
      {showClose ? <OverlayClose offset="sheet" onClick={onClose} /> : null}
    </div>
  );
}
