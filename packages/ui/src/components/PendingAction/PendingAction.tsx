import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { IndeterminateRail } from './IndeterminateRail';
import type { PendingActionProps, PendingActionSpec } from './PendingAction.types';

type NoteVars = CSSProperties & Record<`--${string}`, string>;

interface WebPendingActionProps extends PendingActionProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * An arrow curving back to where it came from: the act was returned. Not error's exclamation
 * (nothing is broken) and not UnavailableNote's slashed circle (this was going to be here).
 */
function ReturnGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="hg-pending-action-glyph"
    >
      <path d="M9 14 5 10l4-4" />
      <path d="M5 10h9a5 5 0 0 1 0 10h-3" />
    </svg>
  );
}

/**
 * THE ROW'S THIRD ANSWER — "this is being done". It adds one line and changes NOTHING else about
 * the row: no opacity, no row tint, no disabling, no pointer-events change, no `aria-invalid`. A
 * second act can start while the first is in flight; hosts set `aria-busy` and leave it operable.
 *
 * THE ACT KEEPS ITS NAME, which is why `Button loading` is not the answer.
 */
export function PendingAction({
  label,
  state = 'waiting',
  reason,
  slowNote,
  onRetry,
  retryLabel = 'Try again',
  onDismiss,
  dismissLabel = 'Dismiss',
  size = 12,
  align = 'left',
  className,
  style,
}: WebPendingActionProps) {
  const returned = state === 'returned';
  const words = returned ? reason : label;
  if (words === undefined || words === null || words === false || words === '') {
    return null;
  }
  const fs = Math.max(12, size);
  const vars: NoteVars = {
    '--hg-pending-action-size': `${fs}px`,
    '--hg-pending-action-glyph-size': `${fs + 1}px`,
    '--hg-pending-action-rail-offset': `${Math.round(fs * 0.62)}px`,
  };
  return (
    <span
      role="status"
      aria-live="polite"
      data-state={state}
      data-align={align}
      className={classNames('hg-pending-action', className)}
      style={{ ...vars, ...style }}
    >
      {returned ? <ReturnGlyph /> : <IndeterminateRail className="hg-pending-action-rail" />}
      <span className="hg-pending-action-words">
        {words}
        {/* M02-24's budget, said in words rather than by the rail getting slower. */}
        {!returned && slowNote !== undefined ? (
          <span className="hg-pending-action-slow">{slowNote}</span>
        ) : null}
      </span>
      {returned && (onRetry !== undefined || onDismiss !== undefined) ? (
        <span className="hg-pending-action-actions">
          {onRetry !== undefined ? (
            <Pressable className="hg-pending-action-pill" onPress={onRetry}>
              {retryLabel}
            </Pressable>
          ) : null}
          {/* Ghost profile: transparent, --text-secondary. Not an inline `none` — that beats field
              mode's rule and leaves the dismiss with no edge in sunlight. */}
          {onDismiss !== undefined ? (
            <Pressable
              className="hg-pending-action-pill hg-pending-action-pill-ghost"
              onPress={onDismiss}
            >
              {dismissLabel}
            </Pressable>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

/** A plain spec object, as opposed to any of the object shapes ReactNode itself allows. */
function isPendingSpec(value: PendingActionSpec | ReactNode): value is PendingActionSpec {
  return (
    typeof value === 'object' &&
    value !== null &&
    !isValidElement(value) &&
    !(Symbol.iterator in value) &&
    !('then' in value)
  );
}

/** What every host's `pending` prop runs through: a string, a spec, or a ready node. */
export function renderPending(
  spec: PendingActionSpec | ReactNode,
  extra: Partial<PendingActionProps> = {},
): ReactNode {
  if (spec === undefined || spec === null || spec === false || spec === '') {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <PendingAction label={spec} {...extra} />;
  }
  if (!isPendingSpec(spec)) {
    return null;
  }
  if (spec.label === undefined && spec.reason === undefined) {
    return null;
  }
  return <PendingAction {...spec} {...extra} />;
}
