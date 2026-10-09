'use client';
import { useShell } from '@heliogrid/data/react';
import { offeredDoors } from '@heliogrid/domain';
import { doorTitle, SHELL } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { notFound } from 'next/navigation';
import { EmptyShellPage } from './components/EmptyShellPage';
import { DOOR_PATH } from './constants';

/**
 * A door the shell opens before its module's screen exists — inside the same shell, so no control
 * is dead and the rail still leads home. Only a door this person's shell offers opens
 * (`offeredDoors`, `F7-48`); any other path is not found. A module's own route replaces its door.
 */
export function PlaceholderScreen({ path }: { path: string }) {
  const t = useTranslate();
  const shell = useShell();
  const door = offeredDoors(shell).find((offered) => DOOR_PATH[offered] === `/${path}`);
  if (door === undefined) notFound();
  return <EmptyShellPage title={doorTitle(t, door)} description={t(SHELL.comingLater)} />;
}
