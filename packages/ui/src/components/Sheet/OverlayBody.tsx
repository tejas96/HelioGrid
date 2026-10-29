import { UnavailableNote } from '../UnavailableNote/UnavailableNote';
import { OverlayEmpty, OverlayError } from './OverlayStates';
import type { OverlayBodyStateProps } from './Sheet.types';

interface OverlayBodyProps extends OverlayBodyStateProps {
  /** The wrapper class that pads `unavailable` inside this particular surface. */
  unavailableClassName: string;
}

/**
 * THE SYSTEM'S FIVE (`SurfaceState`), NOT A PRIVATE THREE — rendered once for the whole Sheet
 * family, so Sheet and DetailPanel cannot drift into answering `unavailable` two ways.
 *
 * `unavailable` is the one that is easiest to reach for and hardest to spell twice: a record the
 * market pack does not cover gets neutral words and NO RETRY, because trying again cannot change
 * the answer. `empty` means none **yet**, so it invites. `error` is the only one with a retry.
 */
export function OverlayBody({
  children,
  emptyAction,
  emptyMessage,
  emptyTitle,
  errorMessage,
  errorTitle,
  focusAfter,
  onRetry,
  retryLabel,
  skeleton,
  state,
  unavailableClassName,
  unavailableAction,
  unavailableMessage,
  unavailableTitle,
  variant,
}: OverlayBodyProps) {
  if (state === 'loading') {
    return skeleton;
  }
  if (state === 'error') {
    return (
      <OverlayError
        focusAfter={focusAfter}
        message={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        title={errorTitle}
        variant={variant}
      />
    );
  }
  /* No retry and no warning tint: the absence is stated, not styled as a fault. */
  if (state === 'unavailable') {
    /* The note is its title; with none given there is nothing to state, and no content either. */
    return unavailableTitle === undefined ? null : (
      <div className={unavailableClassName}>
        <UnavailableNote
          action={unavailableAction}
          message={unavailableMessage}
          title={unavailableTitle}
          variant="region"
        />
      </div>
    );
  }
  if (state === 'empty') {
    return (
      <OverlayEmpty
        action={emptyAction}
        message={emptyMessage}
        title={emptyTitle}
        variant={variant}
      />
    );
  }
  return children;
}
