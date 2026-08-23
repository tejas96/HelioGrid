import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ActionReasonSpec } from './ActionReason.types';

interface WebActionReasonProps extends ActionReasonSpec {
  className?: string;
  style?: CSSProperties;
}

/* A barred circle: "not yet". Deliberately not UnavailableNote's SLASHED circle (that says "not a
   thing here"), and deliberately not error's exclamation — nothing has gone wrong. The px are SVG
   geometry, not layout: the glyph tracks the sentence at one step above its size. */
function BarredCircle({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

/** The precondition sentence beside a control that is off. Renders nothing without a reason. */
export function ActionReason({
  reason,
  id,
  size = 12,
  align = 'left',
  className,
  style,
}: WebActionReasonProps) {
  if (!reason) {
    return null;
  }
  const step = Math.max(12, size);
  return (
    <span
      id={id}
      className={classNames('hg-action-reason', className)}
      data-align={align}
      data-size={step >= 13 ? '13' : '12'}
      style={style}
    >
      <span className="hg-action-reason-glyph">
        <BarredCircle size={step + 1} />
      </span>
      <span className="hg-action-reason-words">{reason}</span>
    </span>
  );
}

/** What every `disabledReason` host prop runs through: a string, a spec, or a ready node. */
export function renderActionReason(
  spec?: ReactNode | ActionReasonSpec,
  extra: Partial<ActionReasonSpec> = {},
): ReactNode {
  if (!spec) {
    return null;
  }
  if (isValidElement(spec)) {
    return spec;
  }
  if (typeof spec === 'string') {
    return <ActionReason reason={spec} {...extra} />;
  }
  if (typeof spec !== 'object' || !('reason' in spec) || !spec.reason) {
    return null;
  }
  return <ActionReason {...spec} {...extra} />;
}

ActionReason.render = renderActionReason;
