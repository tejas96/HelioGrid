import { backToSettings, settingsRowName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { useNavigation } from '@react-navigation/native';
import { ShellPage } from '../shell/components/ShellPage';
import { ProfileEditor } from './components/ProfileEditor';

/**
 * The company profile behind `More` on the phone (`SCR-M01-05`, `m-settings`; `M01-29`): inside
 * the shell with `More` in view, under a bar that holds only its way back to the list and its
 * title, the row's own word. The settings row opens it once its presets allow (`F7-48`).
 */
export function CompanyProfileSettingsScreen() {
  const t = useTranslate();
  const navigation = useNavigation();
  return (
    <ShellPage
      inView="more"
      drillDown={{
        title: settingsRowName(t, 'company_profile'),
        back: backToSettings(t),
        onBack: () => navigation.navigate('More'),
      }}
    >
      <ProfileEditor life="settings" titleInBar />
    </ShellPage>
  );
}
