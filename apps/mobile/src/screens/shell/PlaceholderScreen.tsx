import { useShell } from '@heliogrid/data/react';
import { onItsWayWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { type RouteProp, useRoute } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { ComingPageBody } from './components/ComingPageBody';
import { ShellNotFoundState } from './components/ShellNotFoundState';
import { ShellPage } from './components/ShellPage';
import { type PlaceholderRoute, placeholderDoorOf } from './doors';

/**
 * A door the shell opens before its module's screen exists — inside the same shell, so no control
 * is dead and the pill still leads home. It says what the module will do (`OnItsWay`). Its module replaces it (`T-SHELL-001`'s Used by). A link
 * reaches every door, so one this person's shell does not offer says the page does not exist
 * (`F7-48`), as the web's does.
 */
export function PlaceholderScreen(): ReactNode {
  const t = useTranslate();
  const shell = useShell();
  /* Typed to the routes the placeholder rows make (`doors.ts`): a route it cannot draw fails tsc. */
  const route =
    useRoute<RouteProp<Pick<ReactNavigation.RootParamList, PlaceholderRoute>, PlaceholderRoute>>();
  const door = placeholderDoorOf(route.name);
  return (
    <ShellPage inView={door}>
      {shell.doors.includes(door) ? (
        <ComingPageBody words={onItsWayWords(t, door)} />
      ) : (
        <ShellNotFoundState />
      )}
    </ShellPage>
  );
}
