'use client';
import type { CSSProperties, ReactNode } from 'react';
import './Toast.css';

/** _adherence allowlist: tone, title, description, icon, action, style. */
export interface ToastProps {
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}

/** White toast card with leading semantic icon in a circular tint. Sits above the bottom nav. */
export function Toast({ tone = 'success', title, description, icon, action, style }: ToastProps) {
  return (
    <div
      className="ui-toast"
      role={tone === 'danger' ? 'alert' : 'status'}
      data-tone={tone}
      style={style}
    >
      <span className="ui-toast-icon" aria-hidden>
        {icon ?? (
          <svg
            width="18"
            height="18"
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
        )}
      </span>
      <div className="ui-toast-body">
        <div className="ui-toast-title">{title}</div>
        {description && <div className="ui-toast-desc">{description}</div>}
      </div>
      {action}
    </div>
  );
}
