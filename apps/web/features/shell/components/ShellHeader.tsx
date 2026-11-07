'use client';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  AppHeader,
  IconButton,
  MIN_TOUCH_TARGET,
  type RailItem,
  ShellGlyph,
  Text,
  Wordmark,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';

interface ShellHeaderProps {
  /** The company's name, or none while it loads or after it failed — the bar then shows none. */
  companyName: string | null;
  /** The move to the search door; absent on Frame 8, which has no search. */
  onSearch?: () => void;
  /** The bell, the sidebar's own item: below the desktop width the bar carries it. */
  bell?: RailItem;
  /** The account menu, the sidebar's foot: below the desktop width the bar carries it. */
  account?: ReactNode;
}

/**
 * The web's top bar below the desktop width, where the sidebar gives way to the bottom pill: the
 * wordmark over the company's name, then the search, the bell and the account as icons. From the
 * desktop width up the sidebar holds all four and this bar is not drawn (`shell.css`).
 */
export function ShellHeader({ companyName, onSearch, bell, account }: ShellHeaderProps) {
  const t = useTranslate();
  // The name is the brand: the wordmark, never the sun tile (CLAUDE.md §10), the company under it.
  const tenant = (
    <span className="hg-shell-identity">
      <Wordmark size={theme.type.roles.h3.fontSize} />
      {companyName === null ? null : (
        <Text variant="caption" color="secondary" oneLine className="hg-shell-company">
          {companyName}
        </Text>
      )}
    </span>
  );
  const own = {
    tenant,
    avatar: account,
    actions:
      onSearch === undefined ? undefined : (
        <IconButton
          label={t(SHELL.search)}
          variant="ghost"
          size={MIN_TOUCH_TARGET}
          onClick={onSearch}
        >
          <ShellGlyph name="search" size="md" />
        </IconButton>
      ),
  };
  if (bell?.onClick === undefined) return <AppHeader {...own} />;
  return (
    <AppHeader
      {...own}
      onNotificationsClick={bell.onClick}
      notificationsLabel={bell.label}
      notificationsName={bell.name}
      notificationsOpen={bell.open}
      notifications={bell.badge}
    />
  );
}
