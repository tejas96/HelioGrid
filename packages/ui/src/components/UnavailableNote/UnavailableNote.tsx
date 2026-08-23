import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { UnavailableNoteProps } from './UnavailableNote.types';
import { isBlockedState, SURFACE_STATES } from './UnavailableNote.types';

interface WebUnavailableNoteProps extends UnavailableNoteProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A slashed circle: "not applicable here". Deliberately NOT the warning triangle/exclamation that
 * `error` uses — the mark is the second channel and it must not read as a fault.
 */
function Glyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

/**
 * THE FOURTH STATE, and the one renderer of it. An error says *something went wrong*; unavailable
 * says *this was never going to be here, and that is fine* — a different sentence, a different
 * tone and NO RETRY, EVER. It is not `empty` either: empty means "none yet", which invites; this
 * never invites.
 */
function UnavailableNoteBase({
  title = 'Not available here',
  message,
  detail,
  icon,
  action,
  variant = 'note',
  align,
  className,
  style,
}: WebUnavailableNoteProps) {
  const region = variant === 'region';
  const centred = align === undefined ? region : align === 'center';

  if (region) {
    return (
      <div className={classNames('hg-unavailable-note-region', className)} style={style}>
        <span className="hg-unavailable-note-mark" data-size="region">
          {icon ?? <Glyph />}
        </span>
        <div className="hg-unavailable-note-title">{title}</div>
        {message !== undefined ? (
          <div className="hg-unavailable-note-message">{message}</div>
        ) : null}
        {detail !== undefined ? <div className="hg-unavailable-note-detail">{detail}</div> : null}
        {/* Never a retry. A forward action goes somewhere else. */}
        {action !== undefined ? <div className="hg-unavailable-note-action">{action}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={classNames('hg-unavailable-note', className)}
      data-align={centred ? 'center' : 'start'}
      style={style}
    >
      <span className="hg-unavailable-note-mark" data-size="note">
        {icon ?? <Glyph />}
      </span>
      <div className="hg-unavailable-note-lines">
        <p className="hg-unavailable-note-line">
          <strong className="hg-unavailable-note-subject">
            {title}
            {message !== undefined ? ' — ' : ''}
          </strong>
          {message}
        </p>
        {detail !== undefined ? <span className="hg-unavailable-note-detail">{detail}</span> : null}
        {action}
      </div>
    </div>
  );
}

/** The `.states` / `.isBlockedState` statics the DS attaches to the component. */
export const UnavailableNote = Object.assign(UnavailableNoteBase, {
  states: SURFACE_STATES,
  isBlockedState,
});
