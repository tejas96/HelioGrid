import type { CSSProperties, ReactNode } from 'react';
import { Fragment } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderMarks } from '../ChipGroup';
import { isPendingInFlight } from '../ListRow/ListRow.pending';
import { renderPending } from '../PendingAction';
import { renderProvenance } from '../Provenance';
import { TileActions } from '../TileActions';
import { recordInitials } from './NextAction.initials';
import type { RecordCardProps } from './NextAction.types';

/** Per-instance geometry rides in as custom properties; every colour stays in RecordCard.css. */
type StyleVars = CSSProperties & Record<string, string | number | undefined>;

interface WebRecordCardProps extends RecordCardProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The name, alone as it always was; with a `badge` beside it on one wrapping line, or a `line`
 * under it, the two sit in a name block. Nothing is drawn around a slot that is absent.
 */
function nameBlock(name: string, badge: ReactNode, line: ReactNode): ReactNode {
  const named = <span className="hg-record-card-name">{name}</span>;
  if (!badge && !line) return named;
  return (
    <div className="hg-record-card-who">
      {badge ? (
        <span className="hg-record-card-title">
          {named}
          {badge}
        </span>
      ) : (
        named
      )}
      {line ? <span className="hg-record-card-line">{line}</span> : null}
    </div>
  );
}

/** The card's face: the caller's `avatar`, or the initials circle in the card's tone. */
function RecordFace({
  avatar,
  initials,
  name,
}: Pick<RecordCardProps, 'avatar' | 'initials' | 'name'>) {
  if (avatar) {
    return (
      <span className="hg-record-card-face" aria-hidden="true">
        {avatar}
      </span>
    );
  }
  return (
    <span className="hg-record-card-avatar" aria-hidden="true">
      {initials || recordInitials(name)}
    </span>
  );
}

/** Everything under the name, in order. Nothing is drawn around a slot that is absent. */
function RecordSlots({
  marks,
  meta,
  provenance,
  detail,
  pending,
  action,
}: Pick<RecordCardProps, 'marks' | 'provenance' | 'detail' | 'action'> & {
  meta: ReactNode[];
  pending: ReactNode;
}) {
  return (
    <>
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
      {detail ? <div className="hg-record-card-detail">{detail}</div> : null}
      {pending ? <div className="hg-record-card-pending">{pending}</div> : null}
      {action ? <div className="hg-record-card-action">{action}</div> : null}
    </>
  );
}

/**
 * The phone form of a table row: a face, name + chip, mono meta, next action.
 *
 * **The row is a sibling button, not a wrapper.** With `onClick`, an absolutely-positioned button
 * sits under the content and the content is `pointer-events: none` except in the slots that can
 * hold controls (`chip`, `marks`, `pending`, `action`, `actions`). That is what lets the `action`
 * slot carry a real button: as a `role="button"` wrapper it was invalid nesting, and a tap fired
 * both.
 *
 * `inline` indents every slot beside the face; `stacked` makes the face and the name a head row
 * and gives every slot the full width under it (`SCR-M01-12`).
 */
export function RecordCard({
  name,
  initials,
  avatarTone = 'var(--accent)',
  avatar,
  badge,
  line,
  chip,
  marks,
  meta = [],
  detail,
  action,
  onClick,
  ariaLabel,
  provenance,
  pending,
  muted = false,
  density = 'expressive',
  layout = 'inline',
  actions,
  className,
  style,
}: WebRecordCardProps) {
  const pend = renderPending(pending);
  const vars: StyleVars = { '--hg-record-avatar-tone': avatarTone, ...style };
  const face = <RecordFace avatar={avatar} initials={initials} name={name} />;
  const head = (
    <div className="hg-record-card-head">
      {nameBlock(name, badge, line)}
      {chip ? <span className="hg-record-card-chip">{chip}</span> : null}
    </div>
  );
  const slots = (
    <RecordSlots
      marks={marks}
      meta={meta}
      provenance={provenance}
      detail={detail}
      pending={pend}
      action={action}
    />
  );
  return (
    <div
      className={classNames('hg-record-card', className)}
      data-density={density}
      data-layout={layout}
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
      {layout === 'stacked' ? (
        <>
          <div className="hg-record-card-lead">
            {face}
            {head}
          </div>
          {slots}
        </>
      ) : (
        <>
          {face}
          <div className="hg-record-card-body" data-inert={onClick ? 'true' : undefined}>
            {head}
            {slots}
          </div>
        </>
      )}
      {actions ? (
        <div className="hg-record-card-actions">
          <TileActions>{actions}</TileActions>
        </div>
      ) : null}
    </div>
  );
}
