import type { BillingHomeAdapter } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';

/**
 * The phone's half of billing's ways out: a gateway page opens in the system browser — the
 * product never takes a payment itself (`M12-10`) — the plans open on their own route
 * (`SCR-M12-03`) and `All usage` on the usage row's page (`SCR-M12-04`). A link the browser
 * refuses changes nothing, and the page refetches when the app comes back.
 */
export function useBillingAdapter(): BillingHomeAdapter & { readonly toUsage: () => void } {
  const navigation = useNavigation();
  return {
    openExternal: (url) => void Linking.openURL(url).catch(() => undefined),
    toPlans: () => navigation.navigate('BillingPlans'),
    toUsage: () => navigation.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.usage }),
  };
}
