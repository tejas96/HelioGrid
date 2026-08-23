import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { AppHeaderProps } from './AppShell.types';
import { ShellAction } from './ShellAction';
import { BellIcon } from './ShellIcons';

interface WebAppHeaderProps extends AppHeaderProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The desktop top bar — the header half of `F7-22`'s sidebar-and-header shell. Height is
 * `--header-h`.
 *
 * MS12-19 — BOTH marks are placeable, and they are two different jobs: the PRODUCT mark goes
 * top-left in the rail (`AppRail` draws it), so `brand` here is for the no-rail contexts and the
 * mark is never drawn twice. The TENANT's identity goes in `tenant`, and it is the only
 * tenant-supplied thing in the operator chrome — identity, never theme (`F7-07`).
 */
export function AppHeader({
  title,
  subtitle,
  brand,
  tenant,
  search,
  actions,
  jobs,
  notifications,
  onNotificationsClick,
  avatar,
  breadcrumb,
  sticky = true,
  className,
  style,
}: WebAppHeaderProps) {
  return (
    <header
      className={classNames('hg-app-shell-header', className)}
      data-sticky={sticky ? 'true' : undefined}
      style={style}
    >
      {brand !== undefined ? <div className="hg-app-shell-header-slot">{brand}</div> : null}
      {tenant !== undefined ? (
        <div className="hg-app-shell-header-tenant">
          {tenant}
          {/* A meta separator, not a structural border — --hairline is the sanctioned line. */}
          <span aria-hidden="true" className="hg-app-shell-header-rule" />
        </div>
      ) : null}
      <div className="hg-app-shell-header-titles">
        {breadcrumb}
        {title !== undefined ? <h1 className="hg-app-shell-header-title">{title}</h1> : null}
        {subtitle !== undefined ? <p className="hg-app-shell-header-subtitle">{subtitle}</p> : null}
      </div>
      {/* The global search box (F6-20) — one box, in the shell, never in the page. */}
      {search !== undefined ? <div className="hg-app-shell-header-search">{search}</div> : null}
      <div
        className="hg-app-shell-header-spacer"
        data-tight={search !== undefined ? 'true' : undefined}
      />
      <div className="hg-app-shell-header-actions">
        {actions}
        {/* WORK THE PERSON WALKED AWAY FROM (M02-21) sits here, before the bell: the bell says
            something happened while you were elsewhere, the tray says something is still
            happening. The shell is the only layer that outlives the screen that started it. */}
        {jobs}
        {onNotificationsClick !== undefined ? (
          <ShellAction
            label="Notifications"
            badge={notifications}
            onClick={onNotificationsClick}
            icon={<BellIcon />}
          />
        ) : null}
        {avatar}
      </div>
    </header>
  );
}
