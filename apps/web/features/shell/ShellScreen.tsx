'use client';
import {
  useSearchScreen,
  useSettingsScreen,
  useShellScreen,
  useSidebar,
} from '@heliogrid/data/react';
import {
  accessRemovedWords,
  accountMenuWords,
  appearanceWords,
  connectionWords,
  NOTIFICATION_CENTRE,
  presetName,
  SHELL,
  SIDEBAR,
  searchWords,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { theme } from '@heliogrid/theme';
import {
  AccessRemoved,
  AccountMenu,
  AppearanceSwitch,
  AppRail,
  AppShell,
  BottomNav,
  NoConnection,
  type RailItem,
  ShellGlyph,
  Text,
  useFormat,
  Wordmark,
} from '@heliogrid/ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAppearance } from '../../lib/appearance';
import { InstantMoveProvider, useInstantMove } from '../../lib/instant-move';
import { LeaveGuardProvider, useGuardedMove } from '../../lib/leave-guard';
import { NotificationCentre } from '../notifications';
import { SearchPalette, useSearchKeys } from '../search';
import { GrievanceNote } from './components/GrievanceNote';
import { ShellHeader } from './components/ShellHeader';
import { ShellSearch } from './components/ShellSearch';
import { DOOR_PATH } from './constants';
import { useRailFolded } from './hooks/use-rail-folded';
import { useRailItems } from './hooks/use-rail-items';
import './shell.css';

/**
 * The web shell around every inside page. From the desktop width up: the frosted sidebar — the
 * wordmark, the bell and the fold, the company, the search, the person's work, the settings list
 * and the account with the theme switch at its foot; folded, its icons alone. Below it, the phone's layout: a top bar with the
 * search, the bell and the account as icons, and the floating bottom pill with the destinations. The bell opens the notification centre beside the page (`SCR-SHELL-03`). Every fact is `useShellScreen()`'s, the phone's too, and every part is
 * `packages/ui`'s; this composes and routes. A removal (`S1.wrong.4`) replaces the rail and the
 * page with Frame 8, on whichever route is open — every read is refused there. A device gone
 * offline sees the one no-connection screen instead of blocks that would wait forever (`F8-36`).
 */
export function ShellScreen({ children, strip }: { children: ReactNode; strip?: ReactNode }) {
  return (
    <LeaveGuardProvider>
      <InstantMoveProvider>
        <ShellIn strip={strip}>{children}</ShellIn>
      </InstantMoveProvider>
    </LeaveGuardProvider>
  );
}

/** `strip`: the billing strip (`SCR-SHELL-06`), pinned between the header and the page. */
function ShellIn({ children, strip }: { children: ReactNode; strip?: ReactNode }) {
  const t = useTranslate();
  const screen = useShellScreen();
  const { shell, centre, grievance, connection, unread } = screen;
  const guarded = useGuardedMove();
  const move = useInstantMove();
  const pathname = usePathname();
  /* Leaving the page the centre stands beside closes it — an item's subject, or a rail press. A
     page holding a change asks first (`useLeaveGuard`). */
  const goTo = (path: string) => move(path, centre.close);
  /* A result opened from the palette leaves both overlays behind with the page they stood over. */
  const closeOverlays = () => {
    centre.close();
    screen.search.close();
  };
  const nav = useRailItems(shell, useSidebar(), useSettingsScreen(), goTo);
  const [appearance, chooseAppearance] = useAppearance();
  const [folded, toggleFold] = useRailFolded();
  const search = useSearchScreen({ pack: useFormat().pack });
  useSearchKeys(screen.search.open);
  // A page holding a change asks first, as every in-app move does (D1 A).
  const signOut = () => guarded(screen.signOut);
  const note = <GrievanceNote open={grievance.isOpen} onClose={grievance.close} />;

  if (!connection.online)
    return <NoConnection {...connectionWords(t)} onRetry={connection.retry} />;
  if (shell.accessRemoved) {
    return (
      <AppShell className="hg-shell" header={<ShellHeader companyName={shell.companyName} />}>
        <AccessRemoved
          {...accessRemovedWords(t, shell.companyName)}
          onAction={signOut}
          pending={screen.signingOut}
          onGrievance={grievance.open}
        />
        {note}
      </AppShell>
    );
  }

  const bell: RailItem = {
    key: 'notifications',
    label: t(SHELL.notifications),
    name: t(NOTIFICATION_CENTRE.bellName, { count: unread ?? 0 }),
    icon: <ShellGlyph name="bell" size="md" />,
    badge: unread ?? undefined,
    open: centre.isOpen,
    onClick: centre.toggle,
  };
  /* The rail's account opens towards the page; the phone bar's, at the window's right edge, opens
     back across it, or its list runs off the screen. */
  const accountMenu = (align: 'start' | 'end') => (
    <AccountMenu
      {...accountMenuWords(t, screen.personName)}
      name={screen.personName}
      align={align}
      onGrievance={grievance.open}
      onSignOut={signOut}
    />
  );
  /* Below the desktop width the bar's search opens its page; the sidebar's opens the palette. */
  const openSearchPage = () => move(DOOR_PATH.search);
  const searchItem: RailItem = {
    key: 'search',
    label: t(SHELL.search),
    icon: <ShellGlyph name="search" size="md" />,
    onClick: screen.search.open,
  };
  const role = shell.home === null ? null : presetName(t, shell.home.home);
  return (
    <AppShell
      className={centre.isOpen ? 'hg-shell hg-shell-centre-open' : 'hg-shell'}
      page={pathname}
      strip={strip}
      rail={
        <AppRail
          label={t(SHELL.mainNavigation)}
          brand={<Wordmark size={theme.type.roles.h2.fontSize} />}
          caption={
            shell.companyName === null ? undefined : (
              <Text variant="body-sm" color="secondary" oneLine>
                {shell.companyName}
              </Text>
            )
          }
          search={
            <ShellSearch
              query={search.query}
              onQuery={(query) => {
                search.type(query);
                screen.search.open();
              }}
              onClear={search.clear}
              onOpen={screen.search.open}
            />
          }
          searchItem={searchItem}
          items={nav.rail.items}
          footer={nav.rail.footer}
          value={nav.rail.value}
          onChange={nav.choose}
          bell={bell}
          account={{
            menu: accountMenu('start'),
            name: screen.personName,
            caption:
              role === null || shell.companyName === null
                ? (role ?? undefined)
                : t(SIDEBAR.roleAt, { role, company: shell.companyName }),
            appearance: (
              <AppearanceSwitch
                form="icons"
                words={appearanceWords(t)}
                value={appearance}
                onChange={chooseAppearance}
              />
            ),
          }}
          collapsed={folded}
          fold={{ collapse: t(SIDEBAR.collapse), expand: t(SIDEBAR.expand), onToggle: toggleFold }}
        />
      }
      header={
        <ShellHeader
          companyName={shell.companyName}
          onSearch={openSearchPage}
          bell={bell}
          account={accountMenu('end')}
        />
      }
    >
      {children}
      <BottomNav
        label={t(SHELL.mainNavigation)}
        items={nav.pill.items}
        value={nav.pill.inView}
        onChange={nav.choose}
      />
      {centre.isOpen ? (
        <NotificationCentre
          onClose={centre.close}
          onGoToLeads={screen.offersLeads ? () => goTo(DOOR_PATH.leads) : undefined}
        />
      ) : null}
      {screen.search.isOpen ? (
        <SearchPalette
          screen={search}
          words={searchWords(t)}
          onOpen={(address) => move(`/${address}`, closeOverlays)}
          onClose={screen.search.close}
        />
      ) : null}
      {note}
    </AppShell>
  );
}
