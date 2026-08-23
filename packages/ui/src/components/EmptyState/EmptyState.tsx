import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { EmptyStateProps } from './EmptyState.types';

interface WebEmptyStateProps extends EmptyStateProps {
  className?: string;
  style?: CSSProperties;
}

/** Centred empty state with a soft brand-glow bloom behind a large circular icon container. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  glow = true,
  className,
  style,
}: WebEmptyStateProps) {
  return (
    <div className={classNames('hg-empty-state', className)} style={style}>
      <div className="hg-empty-state-art">
        {glow ? <span className="hg-empty-state-glow" /> : null}
        <span className="hg-empty-state-icon">{icon}</span>
      </div>
      <h3 className="hg-empty-state-title">{title}</h3>
      {description ? <p className="hg-empty-state-description">{description}</p> : null}
      {action ? <div className="hg-empty-state-action">{action}</div> : null}
    </div>
  );
}
