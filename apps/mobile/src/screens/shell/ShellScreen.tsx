import { useConnection, useSession, useShell } from '@heliogrid/data/react';
import {
  accessRemovedWords,
  connectionWords,
  homeBlocksWords,
  homeHeadWords,
  todayLine,
} from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { AccessRemoved, HomeBlocks, HomeHead, NoConnection, useFormat } from '@heliogrid/ui';
import { useRef, useState } from 'react';
import { useWindowDimensions, type View } from 'react-native';
import { FirstRunMark } from './components/FirstRunMark';
import { GrievanceNote } from './components/GrievanceNote';
import { ShellFrame } from './components/ShellFrame';
import { ShellTopBar } from './components/ShellTopBar';
import { switcherWidth } from './styles';
import { usePillItems } from './use-pill-items';

/**
 * The phone shell (`SCR-SHELL-01`): the person's home inside the top bar and the pill. Every fact
 * is `useShell()`'s — the home, the switcher, the verb, the slots, the marks (Law 11) — and every
 * part is `packages/ui`'s, shared with the web; this composes. A device gone offline sees the one
 * no-connection screen instead of blocks that would wait forever (`F8-36`). A removal is checked
 * before anything loaded, since a read in flight comes back refused once the company has removed
 * the person.
 */
export function ShellScreen() {
  const t = useTranslate();
  const format = useFormat();
  const { width } = useWindowDimensions();
  const session = useSession();
  const shell = useShell();
  const titleRef = useRef<View>(null);
  const actionRef = useRef<View>(null);
  const [grievance, setGrievance] = useState(false);
  const items = usePillItems(shell, actionRef);
  const showGrievance = () => setGrievance(true);
  const signOut = () => void session.signOut();
  const connection = useConnection();

  if (!connection.online)
    return <NoConnection {...connectionWords(t)} onRetry={connection.retry} />;
  if (shell.accessRemoved) {
    return (
      <ShellFrame topBar={<ShellTopBar companyName={shell.companyName} />} items={[]}>
        <AccessRemoved
          {...accessRemovedWords(t, shell.companyName)}
          onAction={signOut}
          onGrievance={showGrievance}
        />
        <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
      </ShellFrame>
    );
  }

  const home = shell.home;
  const head = home === null ? null : homeHeadWords(t, home.home, shell.homes);
  return (
    <ShellFrame
      topBar={
        <ShellTopBar
          companyName={shell.companyName}
          account={{
            personName: session.user?.name ?? '',
            onGrievance: showGrievance,
            onSignOut: signOut,
          }}
        />
      }
      items={items}
      inView="home"
    >
      {home === null || head === null ? null : (
        <>
          <HomeHead
            {...head}
            dateLine={todayLine(t, format.date(new Date()))}
            entries={head.entries.map((entry) => ({
              ...entry,
              key: entry.preset,
              onSelect: () => shell.chooseHome(entry.preset),
            }))}
            switcherWidth={switcherWidth(width)}
            titleAnchor={titleRef}
          />
          <HomeBlocks {...homeBlocksWords(t, home)} load={shell.load} onRetry={shell.retry} />
        </>
      )}
      <FirstRunMark shell={shell} anchors={{ switchHome: titleRef, action: actionRef }} />
      <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
    </ShellFrame>
  );
}
