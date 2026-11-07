'use client';
import { useShellScreen } from '@heliogrid/data/react';
import {
  accessRemovedWords,
  accountMenuWords,
  connectionWords,
  NOTIFICATION_CENTRE,
  SHELL,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AccessRemoved,
  AccountMenu,
  AppRail,
  AppShell,
  BottomNav,
  NoConnection,
  ProductMark,
  type RailItem,
  ShellGlyph,
  Text,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { LeaveGuardProvider, useGuardedMove } from '../../lib/leave-guard';
import { NotificationCentre } from '../notifications';
import { GrievanceNote } from './components/GrievanceNote';
import { ShellHeader } from './components/ShellHeader';
import { ShellSearch } from './components/ShellSearch';
import { DOOR_PATH } from './constants';
import { useRailItems } from './hooks/use-rail-items';
import './shell.css';

/**
 * The web shell around every inside page. From the desktop width up: the sidebar — the brand and
 * the company, the search, the person's destinations, the bell and the account at its foot. Below
 * it, the phone's layout: a top bar with the same four as icons, and the floating bottom pill with
 * the destinations. The bell opens the notification centre beside the page (`SCR-SHELL-03`). Every fact is `useShellScreen()`'s, the phone's too, and every part is
 * `packages/ui`'s; this composes and routes. A removal (`S1.wrong.4`) replaces the rail and the
 * page with Frame 8, on whichever route is open — every read is refused there. A device gone
 * offline sees the one no-connection screen instead of blocks that would wait forever (`F8-36`).
 */
export function ShellScreen({ children, strip }: { children: ReactNode; strip?: ReactNode }) {
  return (
    <LeaveGuardProvider>
      <ShellIn strip={strip}>{children}</ShellIn>
    </LeaveGuardProvider>
  );
}

/** `strip`: the billing strip (`SCR-SHELL-06`), pinned between the header and the page. */
function ShellIn({ children, strip }: { children: ReactNode; strip?: ReactNode }) {
  const t = useTranslate();
  const screen = useShellScreen();
  const { shell, centre, grievance, connection, unread } = screen;
  const router = useRouter();
  const guarded = useGuardedMove();
  /* Leaving the page the centre stands beside closes it — an item's subject, or a rail press. A
     page holding a change asks first (`useLeaveGuard`). */
  const goTo = (path: string) =>
    guarded(() => {
      centre.close();
      router.push(path);
    });
  const rail = useRailItems(shell, goTo);
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
  const account = (
    <AccountMenu
      {...accountMenuWords(t, screen.personName)}
      name={screen.personName}
      align="start"
      onGrievance={grievance.open}
      onSignOut={signOut}
    />
  );
  const openSearch = () => guarded(() => router.push(DOOR_PATH.search));
  return (
    <AppShell
      className={centre.isOpen ? 'hg-shell hg-shell-centre-open' : 'hg-shell'}
      strip={strip}
      rail={
        <AppRail
          label={t(SHELL.mainNavigation)}
          brand={<ProductMark />}
          caption={
            shell.companyName === null ? undefined : (
              <Text variant="body-sm" color="secondary">
                {shell.companyName}
              </Text>
            )
          }
          search={
            <ShellSearch
              query={screen.searchQuery}
              onQuery={screen.typeSearch}
              onOpen={openSearch}
            />
          }
          items={rail.items}
          value={rail.inView}
          onChange={rail.choose}
          footer={[bell]}
          avatar={account}
        />
      }
      header={
        <ShellHeader
          companyName={shell.companyName}
          onSearch={openSearch}
          bell={bell}
          account={account}
        />
      }
    >
      {children}
      <BottomNav
        label={t(SHELL.mainNavigation)}
        items={rail.items}
        value={rail.inView}
        onChange={rail.choose}
      />
      {centre.isOpen ? (
        <NotificationCentre
          onClose={centre.close}
          onGoToLeads={screen.offersLeads ? () => goTo(DOOR_PATH.leads) : undefined}
        />
      ) : null}
      {note}
    </AppShell>
  );
}
