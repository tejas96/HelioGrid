import type { CSSProperties } from 'react';
import { Fragment } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderActorClass } from '../ActorClass';
import { renderMarks } from '../ChipGroup';
import { renderOverride } from '../FieldOverride';
import { isPendingInFlight } from '../ListRow/ListRow.pending';
import { renderPending } from '../PendingAction';
import { renderProvenance } from '../Provenance';
import { recordInitials } from './NextAction.initials';
import type { NextActionProps, RecordCardProps } from './NextAction.types';

/** Per-instance geometry rides in as custom properties; every colour stays in NextAction.css. */
type StyleVars = CSSProperties & Record<string, string | number | undefined>;

interface WebNextActionProps extends NextActionProps {
  className?: string;
  style?: CSSProperties;
}

interface WebRecordCardProps extends RecordCardProps {
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
  const text = tone === 'overdue' ? 'overdue' : muted || tone === 'snoozed' ? 'quiet' : 'normal';
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
        <span className="hg-next-action-words">{`${label}${meta ? ` · ${meta}` : ''}`}</span>
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

/**
 * The phone form of a table row: initials circle, name + chip, mono meta, next action.
 *
 * **The row is a sibling button, not a wrapper.** With `onClick`, an absolutely-positioned button
 * sits under the content and the content is `pointer-events: none` except in the slots that can
 * hold controls (`chip`, `marks`, `pending`, `action`). That is what lets the `action` slot carry
 * a real button: as a `role="button"` wrapper it was invalid nesting, and a tap fired both.
 */
export function RecordCard({
  name,
  initials,
  avatarTone = 'var(--accent)',
  chip,
  marks,
  meta = [],
  action,
  onClick,
  ariaLabel,
  provenance,
  pending,
  muted = false,
  density = 'expressive',
  className,
  style,
}: WebRecordCardProps) {
  const ini = initials || recordInitials(name);
  const pend = renderPending(pending);
  const vars: StyleVars = { '--hg-record-avatar-tone': avatarTone, ...style };
  return (
    <div
      className={classNames('hg-record-card', className)}
      data-density={density}
      data-muted={muted ? 'true' : undefined}
      data-clickable={onClick ? 'true' : undefined}
      aria-busy={isPendingInFlight(pending) ? 'true' : undefined}
      style={vars}
    >
      {onClick ? (
        <button
          type="button"
          className="hg-record-card-target"
          onClick={onClick}
          aria-label={ariaLabel || name}
        />
      ) : null}
      <span className="hg-record-card-avatar" aria-hidden="true">
        {ini}
      </span>
      <div className="hg-record-card-body" data-inert={onClick ? 'true' : undefined}>
        <div className="hg-record-card-head">
          <span className="hg-record-card-name">{name}</span>
          {chip ? <span className="hg-record-card-chip">{chip}</span> : null}
        </div>
        {marks ? <div className="hg-record-card-marks">{renderMarks(marks)}</div> : null}
        {meta.length > 0 ? (
          <div className="hg-record-card-meta">
            {meta.map((m, i) => (
              /* `meta` is a fixed positional list of caller nodes with no identity of their
                 own — it is never reordered, filtered or keyed by the caller. */
              // biome-ignore lint/suspicious/noArrayIndexKey: positional list, never reordered.
              <Fragment key={`meta-${i}`}>
                {i > 0 ? (
                  <span className="hg-record-card-meta-sep" aria-hidden="true">
                    ·
                  </span>
                ) : null}
                <span>{m}</span>
              </Fragment>
            ))}
          </div>
        ) : null}
        {provenance ? (
          <div className="hg-record-card-provenance">
            {renderProvenance(provenance, { size: 12 })}
          </div>
        ) : null}
        {pend ? <div className="hg-record-card-pending">{pend}</div> : null}
        {action ? <div className="hg-record-card-action">{action}</div> : null}
      </div>
    </div>
  );
}
