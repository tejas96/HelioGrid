import type { ReactNode } from 'react';

/** `sheet` bodies are 280px wide and 28/24 padded; `panel` bodies 300px and 48 padded. */
export type OverlayStateVariant = 'sheet' | 'panel';

interface OverlayEmptyProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  variant: OverlayStateVariant;
}

interface OverlayErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant: OverlayStateVariant;
  /** The retry's words. The reference hardcodes them; no prop on the contract carries them. */
  retryLabel?: string;
}

/**
 * `empty` means none YET, so it invites: no tint, no glyph, an optional action that makes the
 * first one. The absence of a mark here is the point — a fault glyph would make "none yet" read
 * as "something went wrong".
 */
export function OverlayEmpty({ title, message, action, variant }: OverlayEmptyProps) {
  return (
    <div className="hg-overlay-state" data-variant={variant}>
      <div className="hg-overlay-state-title">{title}</div>
      {message !== undefined ? <div className="hg-overlay-state-message">{message}</div> : null}
      {action}
    </div>
  );
}

/**
 * `error` says something went wrong: warning tint, the warning glyph as the second channel, and a
 * retry — because trying again may work. `unavailable` is the state that gets neither, and it
 * renders through `UnavailableNote` instead.
 */
export function OverlayError({
  title,
  message,
  onRetry,
  variant,
  retryLabel = 'Try again',
}: OverlayErrorProps) {
  return (
    <div className="hg-overlay-state" data-variant={variant}>
      <span className="hg-overlay-state-mark">
        <svg
          aria-hidden="true"
          fill="none"
          height="22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          width="22"
        >
          <path d="M12 9v4M12 17h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <div className="hg-overlay-state-title">{title}</div>
      <div className="hg-overlay-state-message">{message}</div>
      {onRetry !== undefined ? (
        <button className="hg-overlay-state-retry" onClick={onRetry} type="button">
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
