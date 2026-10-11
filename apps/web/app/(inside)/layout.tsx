import type { ReactNode } from 'react';
import { SessionGate } from '../../features/auth';
import { SetupLanguageScreen } from '../../features/onboarding';
import { ShellScreen } from '../../features/shell';

/**
 * The inside group — signed in with a company. The gate and the shell live here once; a page under
 * this folder holds neither. The gate draws the language step in the shell's place for an owner who
 * still owes it.
 */
export default function InsideLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate need="signed-in" languageStep={<SetupLanguageScreen />}>
      <ShellScreen>{children}</ShellScreen>
    </SessionGate>
  );
}
