import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ShellActionProps } from './AppShell.types';
import { badgeName, showsBadge } from './AppShell.types';
import { CountBadge } from './CountBadge';

interface WebShellActionProps extends ShellActionProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A 44×44 shell button with an optional count badge riding its corner. The accessible name is
 * built here — "Notifications, 7 unread" — and an `aria-label` wins over element contents, so
 * the badge's own sr-only sentence is never the one announced.
 */
export function ShellAction({
  label,
  icon,
  badge,
  onClick,
  active = false,
  className,
  style,
}: WebShellActionProps) {
  /* A zero badge keeps the plain name here (the source's `badge ?` test) while it still reaches
     CountBadge, which renders nothing at zero. The rail and the nav item say "0 unread". */
  const name = badge === 0 ? label : badgeName(label, badge);
  return (
    <button
      type="button"
      aria-label={name}
      onClick={onClick}
      className={classNames('hg-app-shell-action', className)}
      data-active={active ? 'true' : undefined}
      style={style}
    >
      {icon}
      {showsBadge(badge) ? (
        <span className="hg-app-shell-action-badge">
          <CountBadge count={badge} label={label.toLowerCase()} />
        </span>
      ) : null}
    </button>
  );
}
