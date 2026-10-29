import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { CoachMarkFootProps, CoachMarkHeadProps } from './CoachMark.types';
import type { PlacedCoachMark } from './coach-mark-place';
import { counterDots, forwardAct, ringBox } from './coach-mark-place';
import type { AnchorRect } from './use-anchor-rect';

/** The system's own 2px accent ring around the live control. There is no scrim. */
export function CoachMarkRing({ rect, padding }: { rect: AnchorRect; padding: number }) {
  return (
    <div
      aria-hidden="true"
      className="hg-coach-mark-ring"
      style={{
        position: rect.box ? 'absolute' : 'fixed',
        ...ringBox(rect, padding),
        borderRadius:
          typeof rect.radius === 'string'
            ? `calc(${rect.radius} + ${padding}px)`
            : rect.radius + padding,
      }}
    />
  );
}

export function CoachMarkHead({ counter, title, dismissLabel, onDismiss }: CoachMarkHeadProps) {
  return (
    <div className="hg-coach-mark-head">
      <div className="hg-coach-mark-heading">
        {counter === null ? null : <div className="hg-coach-mark-counter">{counter}</div>}
        <div className="hg-coach-mark-title" data-counted={counter === null ? undefined : 'true'}>
          {title}
        </div>
      </div>
      {onDismiss === undefined ? null : (
        <Pressable
          className="hg-coach-mark-dismiss"
          accessibilityLabel={dismissLabel}
          onPress={onDismiss}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <ShellGlyphMarks name="close" />
          </svg>
        </Pressable>
      )}
    </div>
  );
}

/** The counter dots number only the marks the user will actually see, and the one forward act. */
export function CoachMarkFoot({
  steps,
  step,
  isLast,
  nextLabel,
  onNext,
  onDismiss,
}: CoachMarkFootProps) {
  const dots = counterDots(steps);
  return (
    <div className="hg-coach-mark-foot">
      <div className="hg-coach-mark-dots">
        {dots.map((position) => (
          <span
            key={`dot-${position}`}
            aria-hidden="true"
            className="hg-coach-mark-dot"
            data-current={position === step ? 'true' : undefined}
          />
        ))}
      </div>
      <Pressable className="hg-coach-mark-next" onPress={forwardAct(isLast, onNext, onDismiss)}>
        {nextLabel}
      </Pressable>
    </div>
  );
}

/** Fixed to the viewport, or absolute inside the scrolling container the anchor lives in. */
export function coachMarkShell(
  rect: AnchorRect | null,
  placed: PlacedCoachMark | null,
  width: number,
): CSSProperties {
  if (rect === null || placed === null) {
    return { width };
  }
  return { position: rect.box ? 'absolute' : 'fixed', top: placed.top, left: placed.left, width };
}

export function CoachMarkArrow({ placed }: { placed: PlacedCoachMark }) {
  return (
    <span
      aria-hidden="true"
      className="hg-coach-mark-arrow"
      data-side={placed.side}
      style={{ left: placed.arrowX - 6 }}
    />
  );
}
