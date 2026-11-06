'use client';
import { SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  AppHeader,
  IconButton,
  LogoTile,
  MIN_TOUCH_TARGET,
  type RailItem,
  ShellGlyph,
  Text,
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
 * product mark and the company's name, then the search, the bell and the account as icons. From
 * the desktop width up the sidebar holds all four and this bar is not drawn (`shell.css`).
 */
export function ShellHeader({ companyName, onSearch, bell, account }: ShellHeaderProps) {
  const t = useTranslate();
  const tenant =
    companyName === null ? undefined : (
      <Text variant="body-sm" bold oneLine className="hg-shell-company">
        {companyName}
      </Text>
    );
  const own = {
    brand: <LogoTile size={theme.spacing['sp-8']} />,
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
      notifications={bell.badge}
    />
  );
}
