import type { BillingStripAdapter } from '@heliogrid/data/react';
import { SETTINGS_SEGMENT } from '@heliogrid/domain';
import { Linking } from 'react-native';
import { navigationRef } from '../../navigation/ref';

/**
 * The strip's and the denial's phone adapter: a pay page opens in the system browser — the product
 * never takes a payment itself (`M12-10`) — and Billing and the plans are routes pushed on the
 * stack, so Back returns to the screen the act was pressed on (decision 3). Through the
 * navigator's handle, since the denial lives above every screen.
 */
export function useBillingStripAdapter(): BillingStripAdapter {
  const ready = () => navigationRef.isReady();
  return {
    openExternal: (url) => void Linking.openURL(url).catch(() => undefined),
    toBillingHome: () => {
      if (ready()) navigationRef.navigate('SettingsRow', { segment: SETTINGS_SEGMENT.billing });
    },
    toPlans: () => {
      if (ready()) navigationRef.navigate('BillingPlans');
    },
  };
}
