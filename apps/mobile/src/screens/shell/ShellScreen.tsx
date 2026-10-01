import { useSession, useShell } from '@heliogrid/data/react';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { AccessRemoved } from './components/AccessRemoved';
import { FirstRunMark } from './components/FirstRunMark';
import { GrievanceNote } from './components/GrievanceNote';
import { HomeBlocks } from './components/HomeBlocks';
import { HomeHead } from './components/HomeHead';
import { ShellFrame } from './components/ShellFrame';
import { ShellTopBar } from './components/ShellTopBar';
import { usePillItems } from './use-pill-items';

/**
 * The phone shell (`SCR-SHELL-01`): the person's home inside the top bar and the pill. Every fact
 * is `useShell()`'s — the home, the switcher, the verb, the slots, the marks (Law 11); this
 * composes. A removal is checked before anything loaded, since a read in flight comes back
 * refused once the company has removed the person.
 */
export function ShellScreen() {
  const session = useSession();
  const shell = useShell();
  const titleRef = useRef<View>(null);
  const actionRef = useRef<View>(null);
  const [grievance, setGrievance] = useState(false);
  const items = usePillItems(shell, actionRef);
  const showGrievance = () => setGrievance(true);
  const signOut = () => void session.signOut();

  if (shell.accessRemoved) {
    return (
      <ShellFrame topBar={<ShellTopBar companyName={shell.companyName} />} items={[]}>
        <AccessRemoved
          companyName={shell.companyName}
          onSignInAgain={signOut}
          onGrievance={showGrievance}
        />
        <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
      </ShellFrame>
    );
  }

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
      {shell.home === null ? null : (
        <>
          <HomeHead
            home={shell.home.home}
            homes={shell.homes}
            onChoose={shell.chooseHome}
            titleRef={titleRef}
          />
          <HomeBlocks home={shell.home} load={shell.load} onRetry={shell.retry} />
        </>
      )}
      <FirstRunMark shell={shell} anchors={{ switchHome: titleRef, action: actionRef }} />
      <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
    </ShellFrame>
  );
}
