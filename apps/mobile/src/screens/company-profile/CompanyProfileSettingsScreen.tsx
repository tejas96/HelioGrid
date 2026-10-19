import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';
import { ProfileEditor } from './components/ProfileEditor';

/**
 * The company profile behind `More` on the phone (`SCR-M01-05`, `m-settings`; `M01-29`): inside
 * the shell with `More` in view, under the settings page's bar — its way back, its title and the
 * search. The settings row opens it once its presets allow (`F7-48`).
 */
export function CompanyProfileSettingsScreen() {
  const drillDown = useSettingsDrillDown('company_profile');
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      <ProfileEditor life="settings" titleInBar />
    </ShellPage>
  );
}
