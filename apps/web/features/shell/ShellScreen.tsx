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
  LogoTile,
  NoConnection,
  type RailItem,
  ShellGlyph,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { LeaveGuardProvider, useGuardedMove } from '../../lib/leave-guard';
import { NotificationCentre } from '../notifications';
import { GrievanceNote } from './components/GrievanceNote';
import { ShellHeader } from './components/ShellHeader';
import { DOOR_PATH } from './constants';
import { useRailItems } from './hooks/use-rail-items';
import './shell.css';

/**
 * The web shell (`SCR-SHELL-01`, `F7-22`'s sidebar and header) around every inside page, at every
 * width: the rail with the person's destinations, the bell and the account at its foot, and the
 * header with the company and the search. The bell opens the notification centre beside the page
 * (`SCR-SHELL-03`). Every fact is `useShellScreen()`'s, the phone's too, and every part is
 * `packages/ui`'s; this composes and routes. A removal (`S1.wrong.4`) replaces the rail and the
 * page with Frame 8, on whichever route is open — every read is refused there. A device gone
 * offline sees the one no-connection screen instead of blocks that would wait forever (`F8-36`).
 */
export function ShellScreen({ children }: { children: ReactNode }) {
  return (
    <LeaveGuardProvider>
      <ShellIn>{children}</ShellIn>
    </LeaveGuardProvider>
  );
}

function ShellIn({ children }: { children: ReactNode }) {
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
  return (
    <AppShell
      className={centre.isOpen ? 'hg-shell hg-shell-centre-open' : 'hg-shell'}
      rail={
        <AppRail
          label={t(SHELL.mainNavigation)}
          brand={<LogoTile />}
          items={rail.items}
          value={rail.inView}
          onChange={rail.choose}
          footer={[bell]}
          avatar={
            <AccountMenu
              {...accountMenuWords(t, screen.personName)}
              name={screen.personName}
              align="start"
              onGrievance={grievance.open}
              onSignOut={signOut}
            />
          }
        />
      }
      header={
        <ShellHeader
          companyName={shell.companyName}
          search={{
            query: screen.searchQuery,
            onQuery: screen.typeSearch,
            onOpen: () => guarded(() => router.push(DOOR_PATH.search)),
          }}
        />
      }
    >
      {children}
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
