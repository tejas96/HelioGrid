import type { CSSProperties } from 'react';
import { Pressable } from '../../primitives/Pressable';
import type { PlacedCoachMark } from './coach-mark-place';
import type { AnchorRect } from './use-anchor-rect';

/** The system's own 2px accent ring around the live control. There is no scrim. */
export function CoachMarkRing({ rect, padding }: { rect: AnchorRect; padding: number }) {
  return (
    <div
      aria-hidden="true"
      className="hg-coach-mark-ring"
      style={{
        position: rect.box ? 'absolute' : 'fixed',
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius:
          typeof rect.radius === 'string'
            ? `calc(${rect.radius} + ${padding}px)`
            : rect.radius + padding,
      }}
    />
  );
}

interface HeadProps {
  counter: string | null;
  title: string;
  dismissLabel: string;
  onDismiss?: () => void;
}

export function CoachMarkHead({ counter, title, dismissLabel, onDismiss }: HeadProps) {
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
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Pressable>
      )}
    </div>
  );
}

interface FootProps {
  steps: number;
  step?: number;
  isLast: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onDismiss?: () => void;
}

/** The counter dots number only the marks the user will actually see, and the one forward act. */
export function CoachMarkFoot({ steps, step, isLast, nextLabel, onNext, onDismiss }: FootProps) {
  const dots = steps > 1 ? Array.from({ length: steps }, (_, index) => index + 1) : [];
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
      <Pressable className="hg-coach-mark-next" onPress={isLast ? (onDismiss ?? onNext) : onNext}>
        {nextLabel ?? (isLast ? 'Got it' : 'Next')}
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
