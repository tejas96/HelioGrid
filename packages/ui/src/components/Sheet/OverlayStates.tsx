import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RetryButton } from '../Button/RetryButton';
import type { OverlayEmptyProps, OverlayErrorProps } from './Sheet.types';

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
  retryLabel,
  focusAfter,
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
          <ShellGlyphMarks name="alert-circle" />
        </svg>
      </span>
      <div className="hg-overlay-state-title">{title}</div>
      {message !== undefined ? <div className="hg-overlay-state-message">{message}</div> : null}
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
    </div>
  );
}
