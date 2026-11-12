import { useCollectionsSettings } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { collectionsSettingsWords, settingsSavedLine } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { CollectionsSettings, closeKeyboard, FormActionBar, useFormat } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * How customers pay you behind `More` on the phone (`SCR-M11-04`): the owner sets the company's UPI
 * ID once and scans the one-rupee QR with their own UPI app to test it. The bank account is the
 * business profile's, edited there. What is read and saved is `useCollectionsSettings`'s, the
 * web's too; the settings page's bar holds the title and the way back.
 */
export function CollectionsSettingsScreen() {
  const drillDown = useSettingsDrillDown('collections');
  const { t, locale } = useI18n();
  const format = useFormat();
  const navigation = useNavigation();
  const screen = useCollectionsSettings();
  const page = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const words = collectionsSettingsWords(
    t,
    { pack: format.pack, language: locale },
    { oneUnit: format.money('1') },
  );
  return (
    <ShellPage
      inView="more"
      drillDown={drillDown}
      foot={
        screen.changed ? (
          <FormActionBar
            placement="sticky"
            align="center"
            saveLabel={words.save}
            onSave={() => {
              closeKeyboard();
              void screen.save();
            }}
            discardLabel={words.discard}
            onDiscard={screen.discard}
            focusAfter={page}
            saving={screen.saving}
            bottomInset={insets.bottom}
          />
        ) : undefined
      }
    >
      <View ref={page}>
        <CollectionsSettings
          read={screen.read}
          words={words}
          savedLine={settingsSavedLine(t, screen.standing, {
            date: (epochMs) => format.date(new Date(epochMs)),
          })}
          saving={screen.saving}
          failure={screen.failure}
          draft={screen.draft}
          onEdit={screen.edit}
          changed={screen.changed}
          onSave={() => void screen.save()}
          onEditBank={() =>
            navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.company_profile })
          }
          focusAfter={page}
        />
      </View>
    </ShellPage>
  );
}
