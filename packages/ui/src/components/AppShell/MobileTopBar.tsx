import { theme } from '@heliogrid/theme';
import { type CSSProperties, useImperativeHandle, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { Text } from '../../primitives/Text/Text';
import { Wordmark } from '../Wordmark/Wordmark';
import type { MobileTopBarProps } from './AppShell.types';
import { ShellAction } from './ShellAction';
import { ShellGlyph } from './ShellGlyph';
import { useBarFade } from './use-bar-fade';

interface WebMobileTopBarProps extends MobileTopBarProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The phone header — the wordmark over the company's name on the left; the round search, the bell
 * and the avatar on the right; or, on a page opened from a list, its way back and its title alone.
 * The name gives way first, so every button keeps its 44. Clear over the page's glow at rest, its
 * frosted band and small title come in with the distance a frame tells (`BarScrollContext`).
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
  titleRef,
  actions,
  safeTop = false,
  sticky = true,
  scrolled = false,
  className,
  style,
}: WebMobileTopBarProps) {
  const titleFrame = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  useImperativeHandle(titleRef, () => ({ focus: (options) => titleFrame.current?.focus(options) }));
  useBarFade(bar);
  return (
    <header
      ref={bar}
      className={classNames('hg-app-shell-topbar', className)}
      data-sticky={sticky ? 'true' : undefined}
      data-safe-top={safeTop ? 'true' : undefined}
      data-scrolled={scrolled ? 'true' : undefined}
      style={style}
    >
      {leading}
      {title !== undefined ? (
        <div ref={titleFrame} tabIndex={-1} className="hg-app-shell-topbar-title hg-focus-target">
          <Text as="h1" variant="h3" bold>
            {title}
          </Text>
        </div>
      ) : (
        <div className="hg-app-shell-topbar-identity">
          <span className="hg-app-shell-header-slot">
            {brand ?? <Wordmark size={theme.type.roles.h3.fontSize} />}
          </span>
          {company !== undefined ? (
            <Text
              variant="caption"
              color="secondary"
              oneLine
              fixedSize
              className="hg-app-shell-topbar-company"
            >
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
