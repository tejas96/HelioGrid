import { useShell } from '@heliogrid/data/react';
import type { ShellDoor } from '@heliogrid/domain';
import { doorTitle, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { EmptyState } from '@heliogrid/ui';
import { useRoute } from '@react-navigation/native';
import { ShellNotFoundState } from './components/ShellNotFoundState';
import { ShellPage } from './components/ShellPage';
import type { DoorRoute } from './doors';

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
  const shell = useShell();
  const route = useRoute();
  const door = DOOR[route.name as DoorRoute];
  return (
    <ShellPage inView={door}>
      {shell.doors.includes(door) ? (
        <EmptyState title={doorTitle(t, door)} description={t(SHELL.comingLater)} />
      ) : (
        <ShellNotFoundState />
      )}
    </ShellPage>
  );
}
