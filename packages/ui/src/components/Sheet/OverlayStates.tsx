import { ShellGlyph } from '../AppShell/ShellGlyph';
import { RetryButton } from '../Button/RetryButton';
import { EmptyScene } from '../EmptyScene/EmptyScene';
import type { OverlayEmptyProps, OverlayErrorProps } from './Sheet.types';

/**
 * `empty` means none YET, so it invites: no tint, no glyph, an optional action that makes the
 * first one. The absence of a mark here is the point — a fault glyph would make "none yet" read
 * as "something went wrong".
 */
export function OverlayEmpty({ title, message, action, scene, variant }: OverlayEmptyProps) {
  return (
    <div className="hg-overlay-state" data-variant={variant}>
      {scene === undefined ? null : <EmptyScene name={scene} />}
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
        <ShellGlyph name="alert-circle" size="lg" tone="current" />
      </span>
      <div className="hg-overlay-state-title">{title}</div>
      {message !== undefined ? <div className="hg-overlay-state-message">{message}</div> : null}
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
    </div>
  );
}
