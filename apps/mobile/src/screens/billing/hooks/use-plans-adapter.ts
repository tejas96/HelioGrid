import type { PlanSelectionAdapter } from '@heliogrid/data/react';
import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';

/**
 * The plans' phone adapter: the provider's page opens in the system browser — the product never
 * takes a payment itself (`M12-10`) — and the page refetches when the app comes back; a scheduled
 * downgrade goes back to Billing, the page it came from (frame 16).
 */
export function usePlansAdapter(): PlanSelectionAdapter {
  const navigation = useNavigation();
  return {
    openExternal: (url) => void Linking.openURL(url).catch(() => undefined),
    toBilling: () => navigation.goBack(),
  };
}
