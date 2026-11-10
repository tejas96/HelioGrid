import type { CustomerMergeScreen } from '@heliogrid/data/react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { Linking } from 'react-native';
import { linkingOptions } from '../../../navigation/linking';

/**
 * Customer Merge's ways out on the phone — the platform adapter: back to the lead it was opened
 * from, the leads list, and a lead at its address through the route table a link uses (`M01-61`).
 */
export function useCustomerMergeMoves() {
  const navigation = useNavigation();
  return {
    cancel: () => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('Leads');
    },
    toLeads: () => navigation.navigate('Leads'),
    openLead: (address: string) => {
      void Linking.openURL(`${linkingOptions.prefixes[0]}${address}`).catch(() => undefined);
    },
  };
}

export type CustomerMergeMoves = ReturnType<typeof useCustomerMergeMoves>;

/**
 * Android's Back and iOS's swipe while the merge is open: on the confirm they go back to the
 * choices, and while the merge is out they wait for its answer — nothing leaves under it.
 */
export function useMergeBack(screen: CustomerMergeScreen) {
  const holding = screen.done === null && (screen.step === 'confirm' || screen.merging);
  usePreventRemove(holding, () => {
    if (!screen.isMerging()) screen.backToChoices();
  });
}
