'use client';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { SettingsList, useDesktopShell } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { settingsRowPath } from './constants';
import { useSettingsList } from './hooks/use-settings-list';

/**
 * The page behind `More` (`SCR-SHELL-01`, *More: the settings list*). At the shell's desktop
 * width a person whose list stands beside settings pages goes straight to its first page, beside
 * that list — the list page would only repeat it (owner ruling). The move REPLACES `/more` in the
 * history, so Back never lands here to be sent on again. Below that width, and for a list of one
 * row, it is the list page: one `SettingsList`, rows domain's, words i18n's.
 */
export function SettingsScreen() {
  const { list, person, open, first } = useSettingsList();
  const desktop = useDesktopShell();
  const router = useRouter();
  useEffect(() => {
    if (desktop === true && first !== null)
      router.replace(settingsRowPath(SETTINGS_SEGMENT[first]));
  }, [desktop, first, router]);
  if (first !== null && desktop !== false) return null;
  return (
    <div className="hg-shell-page">
      <SettingsList title={list.title} person={person} groups={list.groups} onOpen={open} />
    </div>
  );
}
