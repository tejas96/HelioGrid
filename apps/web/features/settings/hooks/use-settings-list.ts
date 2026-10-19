import { useSession } from '@heliogrid/data/react';
import { firstSettingsPageBeside, SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import { settingsListFor } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useRouter } from 'next/navigation';
import { settingsRowPath } from '../constants';

/**
 * The signed-in person's settings list in their language, the way a row opens its page, and the
 * page the list opens first when it stands beside settings pages (`firstSettingsPageBeside`; null
 * when it does not) — one answer for the list page behind `More` and the side list beside every
 * settings page, so the two never disagree.
 */
export function useSettingsList() {
  const t = useTranslate();
  const { user } = useSession();
  const router = useRouter();
  const roles = user?.tenant?.roles ?? [];
  const open = (row: SettingsRow) => router.push(settingsRowPath(SETTINGS_SEGMENT[row]));
  return {
    list: settingsListFor(t, roles),
    person: { name: user?.name ?? '' },
    open,
    first: firstSettingsPageBeside(roles),
  };
}
