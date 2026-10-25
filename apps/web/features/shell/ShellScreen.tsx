'use client';
import { useConnection, useSession, useShell, useUnreadCount } from '@heliogrid/data/react';
import { offersDoor } from '@heliogrid/domain';
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
import { type ReactNode, useState } from 'react';
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
 * (`SCR-SHELL-03`). Every fact is `useShell()`'s and every part is `packages/ui`'s; this
 * composes. A removal (`S1.wrong.4`) replaces the rail and the page with Frame 8, on whichever
 * route is open — every read is refused there. A device gone offline sees the one no-connection
 * screen instead of blocks that would wait forever (`F8-36`).
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
  const session = useSession();
  const shell = useShell();
  const router = useRouter();
  const unread = useUnreadCount();
  const [grievance, setGrievance] = useState(false);
  const [centreOpen, setCentreOpen] = useState(false);
  const guarded = useGuardedMove();
  /* Leaving the page the centre stands beside closes it — an item's subject, or a rail press. A
     page holding a change asks first (`useLeaveGuard`). */
  const goTo = (path: string) =>
    guarded(() => {
      setCentreOpen(false);
      router.push(path);
    });
  const rail = useRailItems(shell, goTo);
  const showGrievance = () => setGrievance(true);
  // A page holding a change asks first, as every in-app move does (D1 A).
  const signOut = () => guarded(() => void session.signOut());
  const note = <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />;
  const connection = useConnection();

  if (!connection.online)
    return <NoConnection {...connectionWords(t)} onRetry={connection.retry} />;
  if (shell.accessRemoved) {
    return (
      <AppShell className="hg-shell" header={<ShellHeader companyName={shell.companyName} />}>
        <AccessRemoved
          {...accessRemovedWords(t, shell.companyName)}
          onAction={signOut}
          onGrievance={showGrievance}
        />
        {note}
      </AppShell>
    );
  }

  const personName = session.user?.name ?? '';
  const bell: RailItem = {
    key: 'notifications',
    label: t(SHELL.notifications),
    name: t(NOTIFICATION_CENTRE.bellName, { count: unread ?? 0 }),
    icon: <ShellGlyph name="bell" size="md" />,
    badge: unread ?? undefined,
    open: centreOpen,
    onClick: () => setCentreOpen((open) => !open),
  };
  const offersLeads = offersDoor(shell, 'leads');
  return (
    <AppShell
      className={centreOpen ? 'hg-shell hg-shell-centre-open' : 'hg-shell'}
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
              {...accountMenuWords(t, personName)}
              name={personName}
              align="start"
              onGrievance={showGrievance}
              onSignOut={signOut}
            />
          }
        />
      }
      header={
        <ShellHeader
          companyName={shell.companyName}
          onSearch={() => guarded(() => router.push(DOOR_PATH.search))}
        />
      }
    >
      {children}
      {centreOpen ? (
        <NotificationCentre
          onClose={() => setCentreOpen(false)}
          onGoToLeads={offersLeads ? () => goTo(DOOR_PATH.leads) : undefined}
        />
      ) : null}
      {note}
    </AppShell>
  );
}
