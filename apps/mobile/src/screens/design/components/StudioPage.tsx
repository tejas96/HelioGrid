import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { StudioWebView } from './StudioWebView';

/** The studio's web view inside the phone's safe areas, on the page's own ground. */
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
  return (
    <View style={[styles.studio, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StudioWebView designId={designId} savedAt={savedAt} onLeave={onLeave} onSite={onSite} />
    </View>
  );
}
