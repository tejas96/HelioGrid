import type { UsageScreenAdapter } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { StackActions, useNavigation } from '@react-navigation/native';

/** The settings page every way back from Usage returns to: Billing (`SCR-M12-02`). */
const BILLING = { segment: SETTINGS_SEGMENT.billing };

/**
 * The usage screen's phone ways out: `Bigger plans` opens the plans on their own route
 * (`SCR-M12-03`), as Billing's `Change plan` does, and `Back to billing` returns to Billing — by
 * popping it when Billing opened this page (`All usage`), else by putting Billing in this page's
 * place, since a page opened from the settings list or a link has no Billing under it.
 */
export function useUsageAdapter(): UsageScreenAdapter & { readonly toBilling: () => void } {
  const navigation = useNavigation();
  return {
    toPlans: () => navigation.navigate('BillingPlans'),
    toBilling: () => {
      const { routes, index } = navigation.getState() ?? { routes: [], index: 0 };
      const under = routes[index - 1];
      const fromBilling =
        under?.name === 'SettingsRow' &&
        (under.params as { segment?: string } | undefined)?.segment === BILLING.segment;
      if (fromBilling) navigation.goBack();
      else navigation.dispatch(StackActions.replace('SettingsRow', BILLING));
    },
  };
}
