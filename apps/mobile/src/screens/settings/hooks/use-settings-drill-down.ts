import type { SettingsRow } from '@heliogrid/domain';
import { backToSettings, settingsRowName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { StackActions, useNavigation } from '@react-navigation/native';

/** The list behind `More`, named once so the way back is still checked against the routes. */
const SETTINGS_LIST = 'More' satisfies keyof ReactNavigation.RootParamList;

/**
 * The bar every settings page opened from `More` draws (`SCR-SHELL-01`, *More: the settings list*):
 * the row's own word as its title and a way back named `Back to settings`. The way back POPS to the
 * list already under the page — `navigate('More')` would stack a second list on top, and the
 * system Back would then return to the page just left; a page opened by a link with no list under
 * it gets the list.
 */
export function useSettingsDrillDown(row: SettingsRow) {
  const t = useTranslate();
  const navigation = useNavigation();
  return {
    title: settingsRowName(t, row),
    back: backToSettings(t),
    onBack: () => navigation.dispatch(StackActions.popTo(SETTINGS_LIST)),
  };
}
