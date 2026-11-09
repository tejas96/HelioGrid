import { useShell } from '@heliogrid/data/react';
import type { ShellDoor } from '@heliogrid/domain';
import { onItsWayWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useRoute } from '@react-navigation/native';
import { ComingPageBody } from './components/ComingPageBody';
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
 * is dead and the pill still leads home. It says what the module will do (`OnItsWay`). Its module replaces it (`T-SHELL-001`'s Used by). A link
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
      {shell.doors.includes(door) && door !== 'more' ? (
        <ComingPageBody words={onItsWayWords(t, door)} />
      ) : (
        <ShellNotFoundState />
      )}
    </ShellPage>
  );
}
