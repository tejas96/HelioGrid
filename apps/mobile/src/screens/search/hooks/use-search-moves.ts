import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';
import { linkingOptions } from '../../../navigation/linking';

/**
 * Search's ways out on the phone — the platform adapter. Cancel goes back to where the search was
 * opened; a result opens at its address, through the same route table a link or a push uses
 * (`M01-61`).
 */
export function useSearchMoves() {
  const navigation = useNavigation();
  return {
    cancel: () => {
      if (navigation.canGoBack()) navigation.goBack();
    },
    open: (address: string) => {
      void Linking.openURL(`${linkingOptions.prefixes[0]}${address}`).catch(() => undefined);
    },
  };
}
