'use client';
import { useSession } from '@heliogrid/data/react';
import { opensSettingsRow, settingsRowOfSegment } from '@heliogrid/domain';
import { SHELL, settingsRowName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { notFound } from 'next/navigation';
import { EmptyShellPage } from '../shell';

/**
 * A settings row's screen before it exists — inside the same shell, so no row is dead, as the
 * shell's doors are (`PlaceholderScreen`). Only a row this person's presets open opens
 * (`opensSettingsRow`, `F7-48`); any other address is not found. A screen's own route replaces it.
 */
export function SettingsRowScreen({ segment }: { segment: string }) {
  const t = useTranslate();
  const { user } = useSession();
  const row = settingsRowOfSegment(segment);
  if (row === null || !opensSettingsRow(user?.tenant?.roles ?? [], row)) notFound();
  return <EmptyShellPage title={settingsRowName(t, row)} description={t(SHELL.comingLater)} />;
}
