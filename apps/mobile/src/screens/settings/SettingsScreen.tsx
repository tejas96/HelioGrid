import { useSettingsScreen } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT, type SettingsRow } from '@heliogrid/domain';
import { destinationLabel, settingsListFor, settingsWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { SettingsList } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { ShellPage } from '../shell/components/ShellPage';
import { tabRoute } from '../shell/doors';
import { useOpenTab } from '../shell/use-open-tab';

/**
 * The page behind `More` on the pill (`SCR-SHELL-01`, *More: the settings list*): the settings
 * screens the signed-in person's presets open, as one `SettingsList` inside the shell's page,
 * `More` in view — first the work lists the pill has no slot for, each opening its own list. What it lists is `useSettingsScreen()`'s, the web's too, and the words are
 * i18n's; this draws and routes.
 */
export function SettingsScreen() {
  const t = useTranslate();
  const settings = useSettingsScreen();
  const navigation = useNavigation();
  const openTab = useOpenTab();
  const list = settingsListFor(t, settings.roles);
  const words = settingsWords(t);
  const open = (row: SettingsRow) =>
    navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT[row] });
  return (
    <ShellPage inView="more">
      <SettingsList
        title={list.title}
        summary={words.summary}
        hints={words.hints}
        person={{ name: settings.personName }}
        groups={list.groups}
        onOpen={open}
        workLists={{
          items: settings.workLists.map((key) => ({ key, name: destinationLabel(t, key) })),
          onOpen: (key) => openTab(tabRoute[key]),
        }}
      />
    </ShellPage>
  );
}
