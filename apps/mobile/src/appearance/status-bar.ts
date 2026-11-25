import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { StatusBar } from 'react-native';

/**
 * A page drawn over a map under the phone's own bar keeps the clock and battery white while it is in
 * front, whatever the app's theme: the map's soft shade sits under them, so dark marks would vanish.
 * Off again as soon as another page comes in front (`AppearanceHost` sets them per theme).
 */
export function useLightBarOverMap(on: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!on) return undefined;
      const entry = StatusBar.pushStackEntry({ barStyle: 'light-content', animated: true });
      return () => StatusBar.popStackEntry(entry);
    }, [on]),
  );
}
