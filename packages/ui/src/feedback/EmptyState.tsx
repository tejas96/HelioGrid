'use client';
import type { CSSProperties, ReactNode } from 'react';
import './EmptyState.css';

/** _adherence allowlist: icon, title, description, action, glow, style. */
export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  glow?: boolean;
  style?: CSSProperties;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  glow = true,
  style,
}: EmptyStateProps) {
  return (
    <div className="ui-empty-state" style={style}>
      <div className="ui-empty-state-figure">
        {glow && <span className="ui-empty-state-glow" aria-hidden />}
        <span className="ui-empty-state-icon">{icon}</span>
      </div>
      <h3 className="ui-empty-state-title">{title}</h3>
      {description && <p className="ui-empty-state-desc">{description}</p>}
      {action && <div className="ui-empty-state-action">{action}</div>}
    </div>
  );
}
