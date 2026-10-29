import { useSettingsScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import { settingsListFor } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useRouter } from 'next/navigation';
import { useGuardedMove } from '../../../lib/leave-guard';
import { settingsRowPath } from '../constants';

/**
 * `useSettingsScreen()` — the phone's too — in the reader's language, with the way a row opens its
 * page on the web: one answer for the list page behind `More` and the side list beside every
 * settings page, so the two never disagree.
 */
export function useSettingsList() {
  const t = useTranslate();
  const settings = useSettingsScreen();
  const router = useRouter();
  const guarded = useGuardedMove();
  // A page holding a change asks first (`useLeaveGuard`).
  const open = (row: SettingsRow) =>
    guarded(() => router.push(settingsRowPath(SETTINGS_SEGMENT[row])));
  return {
    list: settingsListFor(t, settings.roles),
    person: { name: settings.personName },
    open,
    first: settings.firstBeside,
    openedRow: settings.openedRow,
  };
}
