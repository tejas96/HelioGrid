import type { ReactNode } from 'react';
import { OverlayClose } from '../Sheet/OverlayClose';
import type { OverlayStatus, OverlaySubtitleFace } from '../Sheet/Sheet.types';
import { StatusChip } from '../StatusChip/StatusChip';

interface PanelHeaderProps {
  /** Leading node, usually an IconCircle or Avatar. */
  leading?: ReactNode;
  closeLabel: string;
  onClose?: () => void;
  overline?: string;
  /** The scroll shadow — luminance, never a divider line. */
  scrolled: boolean;
  showClose: boolean;
  status?: OverlayStatus;
  /** Rendered in Geist Mono — job IDs, coordinates, invoice numbers. */
  subtitle?: string;
  subtitleFace: OverlaySubtitleFace;
  title?: string;
  titleId: string;
}

/** The panel's sticky header: a leading node, the heading block and the 44×44 dismissal. */
export function PanelHeader({
  leading,
  closeLabel,
  onClose,
  overline,
  scrolled,
  showClose,
  status,
  subtitle,
  subtitleFace,
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
            <div className="hg-overlay-title-line">
              <h2 className="hg-detail-panel-title" id={titleId}>
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
            <div className="hg-detail-panel-subtitle" data-face={subtitleFace}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {showClose ? <OverlayClose label={closeLabel} offset="sheet" onClick={onClose} /> : null}
    </div>
  );
}
