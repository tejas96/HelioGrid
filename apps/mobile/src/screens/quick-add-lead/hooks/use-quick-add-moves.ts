import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';
import { linkingOptions } from '../../../navigation/linking';

/**
 * Quick add's ways out on the phone — the platform adapter. Closing the capture goes back to
 * where its add action was pressed, nothing created; a lead opens at its address, through the
 * same route table a link or a push uses (`M01-61`).
 */
export function useQuickAddMoves() {
  const navigation = useNavigation();
  return {
    back: () => {
      if (navigation.canGoBack()) navigation.goBack();
    },
    openLead: (address: string) => {
      void Linking.openURL(`${linkingOptions.prefixes[0]}${address}`).catch(() => undefined);
    },
  };
}
