import { Linking } from 'react-native';
import { linkingOptions } from '../../navigation/linking';

/**
 * Opens a page of this app by its address, through the same route table a link or a push uses
 * (`M01-61`) — for a move whose page another screen owns, so the two meet only at the address.
 */
export const openInside = (address: string) => {
  void Linking.openURL(`${linkingOptions.prefixes[0]}${address}`).catch(() => undefined);
};
