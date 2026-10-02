import type { ReactNode } from 'react';
import { SessionGate } from '../../features/auth';
import { ShellScreen } from '../../features/shell';

/** The inside group — signed in with a company. The gate and the shell live here once; a page under this folder holds neither. */
export default function InsideLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate need="signed-in">
      <ShellScreen>{children}</ShellScreen>
    </SessionGate>
  );
}
