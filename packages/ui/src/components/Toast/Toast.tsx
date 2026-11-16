import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { LottieMoment } from '../LottieMoment/LottieMoment';
import type { ToastProps } from './Toast.types';

interface WebToastProps extends ToastProps {
  className?: string;
  style?: CSSProperties;
}

/** The default mark: a check. The DS draws one glyph for every tone — the words carry the tone. */
function CheckGlyph() {
  return <ShellGlyph name="check" size="sm" tone="current" />;
}

/**
 * The ink pill with a leading semantic icon in a circular tint, or a Lottie moment. e5, sits above
 * the bottom nav.
 * `role="status"` is polite: a toast never interrupts.
 */
export function Toast({
  tone = 'success',
  title,
  description,
  icon,
  moment,
  action,
  className,
  style,
}: WebToastProps) {
  return (
    <div role="status" className={classNames('hg-toast', className)} style={style}>
      {moment === undefined ? (
        <span className="hg-toast-mark hg-tone" data-tone={tone}>
          {icon ?? <CheckGlyph />}
        </span>
      ) : (
        <span className="hg-toast-moment">
          <LottieMoment name={moment} size={48} />
        </span>
      )}
      <div className="hg-toast-body">
        <div className="hg-toast-title">{title}</div>
        {description ? <div className="hg-toast-description">{description}</div> : null}
      </div>
      {action}
    </div>
  );
}
