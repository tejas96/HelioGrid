import { useSession, useShell } from '@heliogrid/data/react';
import type { ShellDoor } from '@heliogrid/domain';
import { doorTitle, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import { useRoute } from '@react-navigation/native';
import { useRef, useState } from 'react';
import type { View } from 'react-native';
import { GrievanceNote } from './components/GrievanceNote';
import { ShellFrame } from './components/ShellFrame';
import { ShellTopBar } from './components/ShellTopBar';
import type { DoorRoute } from './doors';
import { usePillItems } from './use-pill-items';

/** Each door: the destination it is on the pill, if any, and its title. */
const DOOR: Record<DoorRoute, ShellDoor> = {
  Leads: 'leads',
  Proposals: 'proposals',
  Projects: 'projects',
  People: 'people',
  Campaigns: 'campaigns',
  More: 'more',
  QuickAddLead: 'add_lead',
  StartSurvey: 'start_survey',
  Search: 'search',
  Notifications: 'notifications',
};

/**
 * A door the shell opens before its module's screen exists — inside the same shell, so no control
 * is dead and the pill still leads home. Its module replaces it (`T-SHELL-001`'s Used by).
 */
export function PlaceholderScreen() {
  const t = useTranslate();
  const session = useSession();
  const shell = useShell();
  const route = useRoute();
  const actionRef = useRef<View>(null);
  const [grievance, setGrievance] = useState(false);
  const items = usePillItems(shell, actionRef);
  const door = DOOR[route.name as DoorRoute];
  const title = doorTitle(t, door);
  const inView = items.some((item) => item.key === door) ? door : undefined;

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
      inView={inView}
    >
      <EmptyState title={title} description={t(SHELL.comingLater)} />
      <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
    </ShellFrame>
  );
}
