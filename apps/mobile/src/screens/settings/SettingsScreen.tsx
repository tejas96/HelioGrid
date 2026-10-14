import { useSession } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import { settingsListFor } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SettingsList } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * The page behind `More` on the pill (`SCR-SHELL-01`, *More: the settings list*): the settings
 * screens the signed-in person's presets open, as one `SettingsList` inside the shell's page,
 * `More` in view. The rows are domain's and the words are i18n's; this reads the session, draws
 * and routes.
 */
export function SettingsScreen() {
  const t = useTranslate();
  const { user } = useSession();
  const navigation = useNavigation();
  const list = settingsListFor(t, user?.tenant?.roles ?? []);
  const open = (row: SettingsRow) =>
    navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT[row] });
  return (
    <ShellPage inView="more">
      <SettingsList
        title={list.title}
        person={{ name: user?.name ?? '' }}
        groups={list.groups}
        onOpen={open}
      />
    </ShellPage>
  );
}
