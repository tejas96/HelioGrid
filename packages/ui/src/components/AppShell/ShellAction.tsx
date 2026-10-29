import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ShellActionProps } from './AppShell.types';
import { showsBadge } from './AppShell.types';
import { CountBadge } from './CountBadge';

interface WebShellActionProps extends ShellActionProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A 44×44 shell button with an optional count badge riding its corner — the grey circle when
 * `round`, otherwise transparent until the pointer is over it. The accessible name is the
 * caller's whole name — "Notifications, 7 unread" — and an `aria-label` wins over element
 * contents, so the badge carries no sentence of its own here.
 */
export function ShellAction({
  label,
  icon,
  badge,
  name: wholeName,
  onClick,
  active = false,
  round = false,
  className,
  style,
}: WebShellActionProps) {
  const name = wholeName ?? label;
  return (
    <button
      type="button"
      aria-label={name}
      onClick={onClick}
      className={classNames('hg-app-shell-action', className)}
      data-active={active ? 'true' : undefined}
      data-round={round ? 'true' : undefined}
      style={style}
    >
      {icon}
      {showsBadge(badge) ? (
        <span className="hg-app-shell-action-badge">
          <CountBadge count={badge} />
        </span>
      ) : null}
    </button>
  );
}
