import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';

const styles = StyleSheet.create({
  place: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 },
  attribution: {
    position: 'absolute',
    right: theme.spacing['sp-3'],
    bottom: theme.spacing['sp-2'],
    maxWidth: '70%',
  },
  withOverlay: { top: theme.spacing['sp-3'], bottom: undefined },
});

interface MapPlaceLayerProps {
  onTap: (event: GestureResponderEvent) => void;
}

/**
 * Tap-to-place — a touch addition. It sits above the tiles and BELOW the pin, the controls and
 * the overlay: the overlay carries `MS1-18`'s Confirm Location, and a placement layer stacked
 * over it made the one button that consumes the pending state untappable.
 *
 * The responder system rather than the Pressable primitive, because the primitive's `onPress`
 * carries no event and this layer needs the touch's coordinates. It is a full-bleed surface,
 * not a target, so the 44px law has nothing to say about it.
 */
export function MapPlaceLayer({ onTap }: MapPlaceLayerProps) {
  return (
    <View style={styles.place} onStartShouldSetResponder={() => true} onResponderRelease={onTap} />
  );
}

interface MapAttributionProps {
  words: string | null;
  node: ReactNode;
  hasOverlay: boolean;
}

/**
 * Attribution sits ON the 12px floor, deliberately. It stays quiet by COLOUR and POSITION —
 * `--text-tertiary`, bottom-right, outside the reading path — never by size: this product is a
 * mid-range Android phone on a roof in direct sunlight. Do not "fix" this back down to 10px.
 */
export function MapAttribution({ words, node, hasOverlay }: MapAttributionProps) {
  if (words === null && node === undefined) {
    return null;
  }
  return (
    <View style={[styles.attribution, hasOverlay ? styles.withOverlay : undefined]}>
      {words === null ? null : (
        <Text variant="caption" color="tertiary" align="end">
          {words}
        </Text>
      )}
      {node}
    </View>
  );
}
