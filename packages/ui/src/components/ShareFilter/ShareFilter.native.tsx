import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { ShareBar } from './ShareBar.native';
import type { ShareFilterProps } from './ShareFilter.types';
import { ShareRings } from './ShareRings.native';

interface NativeShareFilterProps extends ShareFilterProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * How a whole splits, and the filter onto each part: `rings` (the phone's overview) or `bar` (the
 * panel's, drawn here too — one contract, both halves). Every ring or count button is a toggle,
 * `selected` on the one in force, and every word is the caller's.
 */
export function ShareFilter({ layout, barLabel, style, ...filter }: NativeShareFilterProps) {
  return (
    <View style={style}>
      {layout === 'rings' ? (
        <ShareRings {...filter} />
      ) : (
        <ShareBar barLabel={barLabel} {...filter} />
      )}
    </View>
  );
}
