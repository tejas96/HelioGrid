'use client';
import type { CSSProperties, ReactNode } from 'react';
import './StatCard.css';

/** _adherence allowlist: label, value, unit, delta, deltaDir, children, style. */
export interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  delta?: ReactNode;
  deltaDir?: 'up' | 'down';
  children?: ReactNode;
  style?: CSSProperties;
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaDir = 'up',
  children,
  style,
}: StatCardProps) {
  return (
    <div className="ui-stat-card" style={style}>
      <div className="ui-stat-card-label">{label}</div>
      <div className="ui-stat-card-row">
        <span className="ui-stat-card-value">{value}</span>
        {unit != null && <span className="ui-stat-card-unit">{unit}</span>}
      </div>
      {delta != null && (
        <span className="ui-stat-card-delta" data-dir={deltaDir}>
          <svg
            role="img"
            aria-label={deltaDir === 'up' ? 'Up' : 'Down'}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {deltaDir === 'up' ? (
              <path d="M7 17 17 7M17 7H9m8 0v8" />
            ) : (
              <path d="M7 7l10 10M17 17H9m8 0V9" />
            )}
          </svg>
          {delta}
        </span>
      )}
      {children}
    </div>
  );
}
