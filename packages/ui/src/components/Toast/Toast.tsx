import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ToastProps } from './Toast.types';

interface WebToastProps extends ToastProps {
  className?: string;
  style?: CSSProperties;
}

/** The default mark: a check. The DS draws one glyph for every tone — the words carry the tone. */
function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * White toast card with a leading semantic icon in a circular tint. e5, sits above the bottom nav.
 * `role="status"` is polite: a toast never interrupts.
 */
export function Toast({
  tone = 'success',
  title,
  description,
  icon,
  action,
  className,
  style,
}: WebToastProps) {
  return (
    <div role="status" className={classNames('hg-toast', className)} style={style}>
      <span className="hg-toast-mark" data-tone={tone}>
        {icon ?? <CheckGlyph />}
      </span>
      <div className="hg-toast-body">
        <div className="hg-toast-title">{title}</div>
        {description ? <div className="hg-toast-description">{description}</div> : null}
      </div>
      {action}
    </div>
  );
}
