import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buttonBarHeight, useCoverButtonBar } from '../../../appearance';
import { styles } from '../styles';
import { StudioWebView } from './StudioWebView';

/**
 * The studio's web view across the whole screen: the map runs under the phone's own bars, and the
 * page keeps its controls clear of them (`insets`). Nothing is painted under the clock's bar or
 * Android's three buttons: they stand on the map, as part of the screen. A page that never asks for the bars (one older than this app) stays inside them, as before.
 */
export function StudioPage({
  designId,
  savedAt,
  onLeave,
  onSite,
}: {
  designId: string;
  /** When Site details last saved a change: the studio opens again on the saved site. */
  savedAt: number | undefined;
  onLeave: () => void;
  onSite: () => void;
}) {
  const insets = useSafeAreaInsets();
  const buttons = buttonBarHeight(insets.bottom);
  // biome-ignore lint/plugin/screen-assembly: whether the page in the native web view runs under the phone's bars; the web has no web view
  const [underBars, setUnderBars] = useState(false);
  // The app's band of page colour under the buttons steps aside: the map runs under them.
  useCoverButtonBar(underBars && buttons > 0);
  const inside = underBars ? null : { paddingTop: insets.top, paddingBottom: insets.bottom };
  return (
    <View style={[styles.studio, inside]}>
      <StudioWebView
        designId={designId}
        savedAt={savedAt}
        onLeave={onLeave}
        onSite={onSite}
        onUnderBars={setUnderBars}
      />
    </View>
  );
}
