import { useSession, useShell } from '@heliogrid/data/react';
import { offersDoor, type ShellDoor } from '@heliogrid/domain';
import { doorTitle, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, EmptyState } from '@heliogrid/ui';
import { useNavigation, useRoute } from '@react-navigation/native';
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
};

/**
 * A door the shell opens before its module's screen exists — inside the same shell, so no control
 * is dead and the pill still leads home. Its module replaces it (`T-SHELL-001`'s Used by). A link
 * reaches every door, so one this person's shell does not offer says the page does not exist
 * (`F7-48`), as the web's does.
 */
export function PlaceholderScreen() {
  const t = useTranslate();
  const session = useSession();
  const shell = useShell();
  const route = useRoute();
  const navigation = useNavigation();
  const actionRef = useRef<View>(null);
  const [grievance, setGrievance] = useState(false);
  const items = usePillItems(shell, actionRef);
  const door = DOOR[route.name as DoorRoute];
  const offered = offersDoor(shell, door);
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
      {offered ? (
        <EmptyState title={doorTitle(t, door)} description={t(SHELL.comingLater)} />
      ) : (
        <EmptyState
          title={t(SHELL.notFound)}
          action={
            <Button variant="primary" size="lg" onClick={() => navigation.navigate('Shell')}>
              {t(SHELL.goToHome)}
            </Button>
          }
        />
      )}
      <GrievanceNote open={grievance} onClose={() => setGrievance(false)} />
    </ShellFrame>
  );
}
