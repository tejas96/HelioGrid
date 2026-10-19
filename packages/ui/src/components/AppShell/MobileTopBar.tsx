import { theme } from '@heliogrid/theme';
import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text/Text';
import { LogoTile } from '../Wordmark/Wordmark';
import type { MobileTopBarProps } from './AppShell.types';
import { ShellAction } from './ShellAction';
import { ShellGlyph } from './ShellGlyph';

interface WebMobileTopBarProps extends MobileTopBarProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone header — the product tile and the company's name as words on the left; the round
 * search, the bell and the avatar on the right; or, on a page opened from a list, its way back and
 * its title alone. The name gives way first, so every button keeps its 44.
 */
export function MobileTopBar({
  company,
  searchLabel,
  notificationsLabel,
  notificationsName,
  brand,
  onSearchClick,
  jobs,
  notifications,
  onNotificationsClick,
  avatar,
  leading,
  title,
  actions,
  safeTop = false,
  sticky = true,
  scrolled = false,
  className,
  style,
}: WebMobileTopBarProps) {
  return (
    <header
      className={classNames('hg-app-shell-topbar', className)}
      data-sticky={sticky ? 'true' : undefined}
      data-safe-top={safeTop ? 'true' : undefined}
      data-scrolled={scrolled ? 'true' : undefined}
      style={style}
    >
      {leading}
      {title !== undefined ? (
        <Text as="h1" variant="h3" bold className="hg-app-shell-topbar-title">
          {title}
        </Text>
      ) : (
        <div className="hg-app-shell-topbar-identity">
          <span className="hg-app-shell-header-slot">
            {brand ?? <LogoTile size={theme.spacing['sp-8']} radius={theme.radius['r-sm']} />}
          </span>
          {company !== undefined ? (
            <Text variant="body" bold oneLine fixedSize className="hg-app-shell-topbar-company">
              {company}
            </Text>
          ) : null}
        </div>
      )}
      <div className="hg-app-shell-topbar-actions">
        {actions}
        {jobs}
        {onSearchClick !== undefined ? (
          <ShellAction
            round
            label={searchLabel}
            onClick={onSearchClick}
            icon={<ShellGlyph name="search" size="md" tone="primary" />}
          />
        ) : null}
        {onNotificationsClick !== undefined ? (
          <ShellAction
            round
            label={notificationsLabel}
            name={notificationsName}
            badge={notifications}
            onClick={onNotificationsClick}
            icon={<ShellGlyph name="bell" size="md" tone="primary" />}
          />
        ) : null}
        {avatar}
      </div>
    </header>
  );
}
