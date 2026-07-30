'use client';
import type { CSSProperties } from 'react';
import './OfflineBanner.css';

/** _adherence allowlist: count, message, style. */
export interface OfflineBannerProps {
  count?: number;
  message?: string;
  style?: CSSProperties;
}

/** Persistent slim pill banner — surveyors work without signal. Warning-tinted, never blocks interaction. */
export function OfflineBanner({ count = 0, message, style }: OfflineBannerProps) {
  return (
    <div className="ui-offline-banner" role="status" style={style}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 14 0M2 8.8l2 2M22 8.8l-11 11" />
      </svg>
      {message ?? `Offline — ${count} change${count === 1 ? '' : 's'} queued`}
    </div>
  );
}
