import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { SitePlaceListProps } from './SiteDetails.logic';

/**
 * The places a typed address matched, on the phone: a list tile under the field, each place a row
 * to press — or one quiet line while the search is out, found nothing or cannot be asked.
 */
export function SitePlaceList({ list, label, disabled, onPick }: SitePlaceListProps) {
  return (
    <View style={styles.box}>
      <GroundProvider ground="tile">
        {list.kind === 'line' ? (
          <View accessibilityLiveRegion="polite" style={styles.line}>
            <Text variant="caption" color="secondary">
              {list.text}
            </Text>
          </View>
        ) : (
          /* RN has no `listbox`: `list` is the nearest true word, as `Select`'s own list says. */
          <View role="list" accessibilityLabel={label}>
            {list.places.map((place) => (
              <View key={place.placeId} role="option">
                <Pressable
                  disabled={disabled}
                  onPress={() => onPick(place.placeId)}
                  style={styles.place}
                >
                  <View style={styles.mark}>
                    <ShellGlyph name="pin" size="sm" />
                  </View>
                  <View style={styles.words}>
                    <Text variant="field-value" style={styles.title}>
                      {place.title}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {place.line}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { ...tileSurface, padding: 6, borderRadius: theme.radius['r-md'] },
  line: { paddingVertical: theme.spacing['sp-2'], paddingHorizontal: theme.spacing['sp-3'] },
  place: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-sm'],
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.spacing['sp-8'],
    height: theme.spacing['sp-8'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['canvas-sunken'],
  },
  words: { flex: 1, minWidth: 0 },
  title: { fontWeight: '500' },
});
