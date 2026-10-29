import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderActorClass } from '../ActorClass';
import { renderOverride } from '../FieldOverride';
import { nextActionInk, nextActionLine } from './NextAction.logic';
import type { NextActionProps } from './NextAction.types';

/** Per-instance geometry rides in as custom properties; every colour stays in NextAction.css. */
type StyleVars = CSSProperties & Record<string, string | number | undefined>;

interface WebNextActionProps extends NextActionProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * "What happens next" — a muted semantic dot plus plain text. `tone="overdue"` is the only case
 * that turns red, which is what keeps red meaningful; snoozed records go tertiary rather than
 * disappearing.
 *
 * A TASK SAYS WHY IT EXISTS (`M07-06`): `origin` is that slot and `ActorClass` renders it. A
 * corrected task keeps both readings (`SCR-M07-13`): `correction` is a `FieldOverride` spec, the
 * system's one superseded-value treatment.
 */
export function NextAction({
  label,
  meta,
  tone = 'due',
  muted = false,
  origin,
  correction,
  size = 13,
  className,
  style,
}: WebNextActionProps) {
  const text = nextActionInk(tone, muted);
  const stacked = Boolean(origin) || Boolean(correction);
  const vars: StyleVars = { '--hg-next-action-size': `${size}px`, ...style };
  return (
    <span
      className={classNames('hg-next-action', className)}
      data-tone={tone}
      data-text={text}
      data-stacked={stacked ? 'true' : undefined}
      style={vars}
    >
      <span className="hg-next-action-line">
        <span className="hg-next-action-dot" aria-hidden="true" />
        <span className="hg-next-action-words">{nextActionLine(label, meta)}</span>
      </span>
      {origin ? (
        <span className="hg-next-action-origin">
          {renderActorClass(origin, { form: 'origin', size: 12 })}
        </span>
      ) : null}
      {correction ? (
        <span className="hg-next-action-correction">{renderOverride(correction)}</span>
      ) : null}
    </span>
  );
}
