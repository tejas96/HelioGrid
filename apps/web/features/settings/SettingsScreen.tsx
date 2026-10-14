'use client';
import { useSession } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import { settingsListFor } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SettingsList } from '@heliogrid/ui';
import { useRouter } from 'next/navigation';
import { settingsRowPath } from './constants';

/**
 * The page behind `More` (`SCR-SHELL-01`, *More: the settings list*): the settings screens the
 * signed-in person's presets open, as one `SettingsList`. The rows are domain's and the words are
 * i18n's; this reads the session, draws and routes.
 */
export function SettingsScreen() {
  const t = useTranslate();
  const { user } = useSession();
  const router = useRouter();
  const list = settingsListFor(t, user?.tenant?.roles ?? []);
  const open = (row: SettingsRow) => router.push(settingsRowPath(SETTINGS_SEGMENT[row]));
  return (
    <div className="hg-shell-page">
      <SettingsList
        title={list.title}
        person={{ name: user?.name ?? '' }}
        groups={list.groups}
        onOpen={open}
      />
    </div>
  );
}
