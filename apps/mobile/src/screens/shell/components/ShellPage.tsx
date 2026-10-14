import { useSession, useShell } from '@heliogrid/data/react';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { usePillItems } from '../use-pill-items';
import { GrievanceNote } from './GrievanceNote';
import { ShellFrame } from './ShellFrame';
import { ShellTopBar } from './ShellTopBar';

/**
 * A page inside the shell that is not the home: the shell's top bar with the account's acts, the
 * pill with `inView` lit when the pill names it, and the grievance note — written once for every
 * such screen (`PlaceholderScreen`, the settings list and its rows).
 */
export function ShellPage({ inView, children }: { inView?: string; children: ReactNode }) {
  const session = useSession();
  const shell = useShell();
  const actionRef = useRef<View>(null);
  const [grievance, setGrievance] = useState(false);
  const items = usePillItems(shell, actionRef);
  const lit = inView !== undefined && items.some((item) => item.key === inView);
  return (
    <ShellFrame
      topBar={
        <ShellTopBar
          companyName={shell.companyName}
          account={{
            personName: session.user?.name ?? '',
            onGrievance: () => setGrievance(true),
            onSignOut: () => void session.signOut(),
          }}
        />
      }
      items={items}
      inView={lit ? inView : undefined}
    >
      {children}
      <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
    </ShellFrame>
  );
}
