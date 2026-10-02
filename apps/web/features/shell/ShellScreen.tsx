'use client';
import { useSession, useShell } from '@heliogrid/data/react';
import { accessRemovedWords, accountMenuWords, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  AccessRemoved,
  AccountMenu,
  AppRail,
  AppShell,
  LogoTile,
  type RailItem,
  ShellGlyph,
} from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { GrievanceNote } from './components/GrievanceNote';
import { ShellHeader } from './components/ShellHeader';
import { DOOR_PATH } from './constants';
import { useRailItems } from './hooks/use-rail-items';
import './shell.css';

/**
 * The web shell (`SCR-SHELL-01`, `F7-22`'s sidebar and header) around every inside page, at every
 * width: the rail with the person's destinations, the bell and the account at its foot, and the
 * header with the company and the search. Every fact is `useShell()`'s and every part is
 * `packages/ui`'s; this composes. A removal (`S1.wrong.4`) replaces the rail and the page with
 * Frame 8, on whichever route is open — every read is refused there.
 */
export function ShellScreen({ children }: { children: ReactNode }) {
  const t = useTranslate();
  const session = useSession();
  const shell = useShell();
  const router = useRouter();
  const rail = useRailItems(shell, (path) => router.push(path));
  const [grievance, setGrievance] = useState(false);
  const showGrievance = () => setGrievance(true);
  const signOut = () => void session.signOut();
  const note = <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />;

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
    icon: <ShellGlyph name="bell" size="md" />,
    onClick: () => router.push(DOOR_PATH.notifications),
  };
  return (
    <AppShell
      className="hg-shell"
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
          onSearch={() => router.push(DOOR_PATH.search)}
        />
      }
    >
      {children}
      {note}
    </AppShell>
  );
}
