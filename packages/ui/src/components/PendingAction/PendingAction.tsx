import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { focusAfterFirst, NO_FOCUS_AFTER, useFocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { Button } from '../Button/Button';
import { RetryButton } from '../Button/RetryButton';
import { IndeterminateRail } from './IndeterminateRail';
import { pendingLine, readPendingInput } from './PendingAction.logic';
import type { PendingActionProps, PendingActionSpec } from './PendingAction.types';

type NoteVars = CSSProperties & Record<`--${string}`, string>;

type WebPendingActionProps = PendingActionProps & {
  className?: string;
  style?: CSSProperties;
};

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
      <ShellGlyphMarks name="undo-step" />
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
export function PendingAction(props: WebPendingActionProps) {
  const {
    state = 'waiting',
    slowNote,
    onRetry,
    retryLabel,
    onDismiss,
    dismissLabel,
    focusAfter,
    align = 'left',
    className,
    style,
  } = props;
  const frame = useRef<HTMLSpanElement>(null);
  const leaving = useFocusAfter(focusAfter ?? NO_FOCUS_AFTER);
  const shown = pendingLine(props);
  if (shown === null) {
    return null;
  }
  const { returned, words, fontSize } = shown;
  const vars: NoteVars = {
    '--hg-pending-action-size': `${fontSize}px`,
    '--hg-pending-action-glyph-size': `${shown.glyphSize}px`,
    '--hg-pending-action-rail-offset': `${shown.railOffset}px`,
  };
  return (
    <span
      ref={frame}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      data-state={state}
      data-align={align}
      className={classNames('hg-pending-action', 'hg-focus-target', className)}
      style={{ ...vars, ...style }}
    >
      {returned ? <ReturnGlyph /> : <IndeterminateRail className="hg-pending-action-rail" />}
      <span className="hg-pending-action-words">
        {words}
        {/* M02-24's budget, said in words rather than by the rail getting slower. */}
        {shown.showsSlowNote ? <span className="hg-pending-action-slow">{slowNote}</span> : null}
      </span>
      {shown.offersActs ? (
        <span className="hg-pending-action-actions">
          <RetryButton
            onRetry={onRetry}
            label={retryLabel}
            focusAfter={focusAfterFirst(frame, focusAfter ?? NO_FOCUS_AFTER)}
          />
          {onDismiss !== undefined ? (
            <Button variant="ghost" size="md" onClick={leaving(onDismiss)}>
              {dismissLabel}
            </Button>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

/** What every host's `pending` prop runs through: a string, a spec, or a ready node. */
export function renderPending(
  spec: PendingActionSpec | ReactNode,
  extra: Pick<PendingActionProps, 'size' | 'align'> = {},
): ReactNode {
  const input = readPendingInput(spec);
  if (input === null) {
    return null;
  }
  return 'node' in input ? input.node : <PendingAction {...input.spec} {...extra} />;
}
