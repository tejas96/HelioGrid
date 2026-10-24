import { useRolesReference } from '@heliogrid/data/react';
import { OPENED_FROM_ASSIGN_ROLES, SETTINGS_SEGMENT } from '@heliogrid/domain';
import { rolesReferenceWords } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { RolesReference } from '@heliogrid/ui';
import { useNavigation } from '@react-navigation/native';
import { useSettingsDrillDown } from '../settings/hooks/use-settings-drill-down';
import { ShellPage } from '../shell/components/ShellPage';

/**
 * The Roles reference behind `More` on the phone (`SCR-M01-14`, the 375 frames): the settings
 * page's bar, the twelve roles, who holds each and what each can do. Opened from Assign Roles, the
 * bar's way back names it and pops back to Team, still under this page, where the editor opens
 * again with the ticks it kept (`useAssignRoles`' `resume`).
 */
export function RolesReferenceScreen({ from }: { from: string | null }) {
  const { t, locale } = useI18n();
  const navigation = useNavigation();
  const settings = useSettingsDrillDown('roles');
  const reference = useRolesReference(locale);
  const words = rolesReferenceWords(t, reference.holdings);
  /* Opened by a link, nothing is under this page: Team is opened in its place. */
  const backToAssign = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.team });
  };
  const drillDown =
    from === OPENED_FROM_ASSIGN_ROLES
      ? { title: settings.title, back: words.backToAssign, onBack: backToAssign }
      : settings;
  return (
    <ShellPage inView="more" drillDown={drillDown}>
      <RolesReference words={words} counts={reference.load} onRetry={reference.retry} title="bar" />
    </ShellPage>
  );
}
