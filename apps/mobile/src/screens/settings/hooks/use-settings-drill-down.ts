import type { SettingsRow } from '@heliogrid/domain';
import { backToSettings, settingsRowName } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { tabRoute } from '../../shell/doors';

/** The list behind `More`: its tab, named once so the way back is still checked against the routes. */
const SETTINGS_LIST = tabRoute.more;

/**
 * The bar every settings page opened from `More` draws (`SCR-SHELL-01`, *More: the settings list*):
 * the row's own word as its title and a way back named `Back to settings`. The way back POPS to the
 * tabs under the page and shows More, so the system Back never returns to the page just left; a
 * page opened by a link, with only the home under it, lands on the list too.
 */
export function useSettingsDrillDown(row: SettingsRow) {
  const t = useTranslate();
  const navigation = useNavigation();
  return {
    title: settingsRowName(t, row),
    back: backToSettings(t),
    onBack: () => navigation.dispatch(StackActions.popTo('Main', { screen: SETTINGS_LIST })),
  };
}
