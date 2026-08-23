import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { MobileTopBarProps } from './AppShell.types';
import { ShellAction } from './ShellAction';
import { BellIcon, SearchIcon } from './ShellIcons';

interface WebMobileTopBarProps extends MobileTopBarProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone top bar — `--topbar-h-mobile`, with the same search and bell obligations.
 *
 * The phone has no rail, so here `brand` IS where the product mark rides and `tenant` sits
 * beside it. With a title present, pass the compact `TenantMark` (`showName={false}`) — the bar
 * has room for one set of words, and the screen's own title outranks the tenant's name.
 */
export function MobileTopBar({
  title,
  brand,
  tenant,
  onSearchClick,
  jobs,
  notifications,
  onNotificationsClick,
  avatar,
  leading,
  actions,
  sticky = true,
  className,
  style,
}: WebMobileTopBarProps) {
  return (
    <header
      className={classNames('hg-app-shell-topbar', className)}
      data-sticky={sticky ? 'true' : undefined}
      style={style}
    >
      {leading}
      {brand !== undefined ? <div className="hg-app-shell-header-slot">{brand}</div> : null}
      {tenant !== undefined ? <div className="hg-app-shell-header-slot">{tenant}</div> : null}
      {title !== undefined ? <h1 className="hg-app-shell-topbar-title">{title}</h1> : null}
      {title === undefined ? <div className="hg-app-shell-topbar-spacer" /> : null}
      <div className="hg-app-shell-topbar-actions">
        {actions}
        {jobs}
        {onSearchClick !== undefined ? (
          <ShellAction label="Search" onClick={onSearchClick} icon={<SearchIcon />} />
        ) : null}
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
