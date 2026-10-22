import { useSession } from '@heliogrid/data/react';
import { profilePreferencesView } from '@heliogrid/domain';
import { profilePreferencesWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { ProfilePreferences, useFormat } from '@heliogrid/ui';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * Profile & preferences behind `More` on the phone (`SCR-M01-11`, `m-default`): under the settings
 * page's bar — its way back, its title and the search. A language applies through the provider,
 * which saves it (`F3-04`); a unit through the session; a refused save shows on its control (D219).
 */
export function ProfileScreen() {
  const drillDown = useSettingsDrillDown('profile');
  const { t, locale, device, setLocale } = useI18n();
  const { pack } = useFormat();
  const { user, refusedPreferences, setUnitPreference } = useSession();
  if (user === null) return null;
  const view = profilePreferencesView({ user, device, marketUnits: pack.measurementSystem });
  const words = profilePreferencesWords(t, view, {
    reader: locale,
    pack,
    refused: refusedPreferences,
  });
  return (
    <ShellPage inView="more" drillDown={drillDown} pad="functional">
      <ProfilePreferences
        words={words}
        view={view}
        name={user.name}
        onLanguage={(next) => void setLocale(next)}
        onUnits={(next) => void setUnitPreference(next)}
      />
    </ShellPage>
  );
}
