import type { StateMessageProps } from './StateBody.types';

/** The one quiet sentence an inline body's empty and error forms draw. */
export function StateMessage({ tone, title, message, action }: StateMessageProps) {
  return (
    <div className="hg-state-message">
      <p className="hg-state-message-text" data-tone={tone}>
        {title !== undefined ? (
          <strong className="hg-state-message-title">
            {title}
            {message !== undefined ? ' — ' : ''}
          </strong>
        ) : null}
        {message}
      </p>
      {action}
    </div>
  );
}
