import { Linking, Platform } from 'react-native';

/** Opens a link in the app the phone hands it to; a link nothing on the phone takes does nothing. */
export const openOutside = (url: string) => {
  void Linking.openURL(url).catch(() => undefined);
};

/** The phone's maps, asked for a place by its words. */
export const openDirections = (place: string) =>
  openOutside(
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodeURIComponent(place)}`
      : `geo:0,0?q=${encodeURIComponent(place)}`,
  );

/** Dials a number in the phone's own dialler. */
export const dial = (phoneE164: string) => openOutside(`tel:${phoneE164}`);
