import { colors } from '@heliogrid/ui';
import { useFocusEffect } from '@react-navigation/native';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Android's three-button bar is 40dp or taller; the gesture handle's inset is 16–24dp, and the
 * iPhone's home indicator is not a bar of buttons. Read from the inset, since React Native names
 * no navigation mode, so this is the one place the cut lives.
 */
const BUTTON_BAR_FROM = 32;

/** The height of Android's three-button bar under the app, or 0 where the phone has none. */
export function buttonBarHeight(bottomInset: number): number {
  return Platform.OS === 'android' && bottomInset >= BUTTON_BAR_FROM ? bottomInset : 0;
}

type Cover = (owner: symbol, covering: boolean) => void;

const CoverContext = createContext<Cover | null>(null);

/**
 * The page's own colour under Android's three system buttons. From Android 15 the app draws under
 * the bar, and the system's contrast scrim (turned off in `values-v27/styles.xml`) drew a grey band
 * there; this band is the page's colour instead, so the bar reads as part of the page and its
 * buttons stay readable over anything that scrolls. Drawn under every portal layer, so a sheet still
 * runs to the screen's foot; a page whose own act bar paints under the bar takes the band away
 * while it is in front (`useCoverButtonBar`).
 */
export function ButtonBarBand({ children }: { children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  const [covers, setCovers] = useState<ReadonlySet<symbol>>(new Set());
  const cover = useCallback<Cover>((owner, covering) => {
    setCovers((now) => {
      if (now.has(owner) === covering) return now;
      const next = new Set(now);
      if (covering) next.add(owner);
      else next.delete(owner);
      return next;
    });
  }, []);
  const height = buttonBarHeight(bottom);
  return (
    <CoverContext.Provider value={cover}>
      {children}
      {height === 0 || covers.size > 0 ? null : (
        <View pointerEvents="none" style={[styles.band, { height }]} />
      )}
    </CoverContext.Provider>
  );
}

/** A page whose act bar paints under the system buttons takes the band away while it is in front. */
export function useCoverButtonBar(covering: boolean) {
  const cover = useContext(CoverContext);
  const owner = useMemo(() => Symbol('button-bar'), []);
  useFocusEffect(
    useCallback(() => {
      if (cover === null || !covering) return undefined;
      cover(owner, true);
      return () => cover(owner, false);
    }, [cover, covering, owner]),
  );
}

const styles = StyleSheet.create({
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
  },
});
