import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useFocusAfter } from '../../primitives/FocusAfter';
import { Portal, usePortalBottomInset } from '../../primitives/Portal/Portal.native';
import { Text } from '../../primitives/Text/Text.native';
import { useCloseOnBack } from '../../primitives/use-close-on-back.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { MapSurface } from '../MapSurface/MapSurface.native';
import { SITE_PIN_PLACEMENT, type SiteBigMapProps, sitePinOf } from './SiteDetails.logic';

/**
 * The bigger map on the phone: the same map and pin on the whole screen, in a layer over the page.
 * Every control stands at its foot, above the home indicator — the one device band this package
 * is told — so none sits under the status bar: the way back with the hint beside it, then the
 * pin's figure and *Use this point*. Android's Back closes it first; either way out returns to the
 * form, and the screen reader to the button that opened it.
 *
 * web-only part: Sheet — the web's Esc, focus trap and scroll lock are the overlay family's hook; the phone's are Portal, Back and a modal view
 */
export function SiteBigMap({ form, pin, map, words, focusAfter }: SiteBigMapProps) {
  const leaving = useFocusAfter(focusAfter);
  const close = leaving(map.onSmall);
  const bottomInset = usePortalBottomInset();
  useCloseOnBack(true, close);
  return (
    <Portal>
      <View accessibilityViewIsModal style={styles.layer}>
        <MapSurface
          read={map.read}
          words={words.map}
          placement={SITE_PIN_PLACEMENT}
          pin={sitePinOf(form.mount, words)}
          controls={false}
          radius={0}
          style={styles.surface}
        >
          {map.tiles}
        </MapSurface>
        <View
          pointerEvents="box-none"
          style={[styles.foot, { paddingBottom: theme.spacing['sp-3'] + bottomInset }]}
        >
          <View pointerEvents="box-none" style={styles.back}>
            <IconButton label={words.closeMap} onClick={close}>
              <ShellGlyph name="chevron-left" size="md" tone="primary" />
            </IconButton>
            <View style={styles.tip}>
              <Text variant="caption">{words.pinHint}</Text>
            </View>
          </View>
          <View style={styles.bar}>
            {pin === null ? null : (
              <Text variant="body-sm" style={styles.figure}>
                {pin}
              </Text>
            )}
            <Button
              variant="primary"
              size="md"
              iconRight={<ShellGlyph name="check" size="md" tone="inverse" />}
              onClick={close}
            >
              {words.usePoint}
            </Button>
          </View>
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors['canvas-sunken'],
  },
  /* The whole layer, flat: with no elevation of its own, Android draws the foot above it. */
  surface: { height: '100%', elevation: 0, shadowOpacity: 0 },
  foot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.spacing['sp-4'],
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  tip: {
    flexShrink: 1,
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: colors.surface,
    ...theme.elevation.e2,
  },
  /* The figure and the act share a row where both fit, and stack where they do not: a pin's
     figure is never cut short. */
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    paddingLeft: theme.spacing['sp-5'],
    paddingRight: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-lg'],
    // biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
    backgroundColor: colors.surface,
    ...theme.elevation.e4,
  },
  figure: { fontFamily: theme.type.families.mono },
});
