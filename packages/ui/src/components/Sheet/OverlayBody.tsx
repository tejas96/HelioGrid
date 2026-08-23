import type { ReactNode } from 'react';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type { OverlayStateVariant } from './OverlayStates';
import { OverlayEmpty, OverlayError } from './OverlayStates';

interface OverlayBodyProps {
  children?: ReactNode;
  emptyAction?: ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  errorMessage?: string;
  errorTitle?: string;
  onRetry?: () => void;
  /** The surface's own `loading` shape — a sheet's bars are not a panel's. */
  skeleton: ReactNode;
  state: SurfaceState;
  /** The wrapper class that pads `unavailable` inside this particular surface. */
  unavailableClassName: string;
  unavailableAction?: ReactNode;
  unavailableMessage?: string;
  unavailableTitle?: string;
  variant: OverlayStateVariant;
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
  onRetry,
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
      <OverlayError message={errorMessage} onRetry={onRetry} title={errorTitle} variant={variant} />
    );
  }
  /* No retry and no warning tint: the absence is stated, not styled as a fault. */
  if (state === 'unavailable') {
    return (
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
