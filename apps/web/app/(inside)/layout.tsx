import type { ReactNode } from 'react';
import { SessionGate } from '../../features/auth';
import { ShellBillingStrip } from '../../features/billing';
import {
  CompanyProfileScreen,
  SetupInviteTeamScreen,
  SetupLanguageScreen,
  SetupReadyScreen,
  SetupWhatYouSellScreen,
} from '../../features/onboarding';
import { ShellScreen } from '../../features/shell';
import { FocusOrShell } from '../../lib/focus-screen';

/**
 * The inside group — signed in with a company. The gate and the shell live here once; a page under
 * this folder holds neither. The gate draws a setup step in the shell's place for an owner who
 * still owes it, and a focus screen (`lib/focus-screen.tsx`) is drawn without the shell.
 */
export default function InsideLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate
      need="signed-in"
      setupSteps={{
        'language-step': <SetupLanguageScreen />,
        'what-you-sell-step': <SetupWhatYouSellScreen />,
        'company-profile-step': <CompanyProfileScreen life="setup" />,
        'invite-team-step': <SetupInviteTeamScreen />,
        'ready-step': <SetupReadyScreen />,
      }}
    >
      <FocusOrShell shell={<ShellScreen strip={<ShellBillingStrip />}>{children}</ShellScreen>}>
        {children}
      </FocusOrShell>
    </SessionGate>
  );
}
