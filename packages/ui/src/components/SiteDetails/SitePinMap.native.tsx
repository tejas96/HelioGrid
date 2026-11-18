import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { IconButton } from '../IconButton/IconButton.native';
import { MapSurface } from '../MapSurface/MapSurface.native';
import { SiteBigMap } from './SiteBigMap.native';
import {
  pinNoteOf,
  pinRunsOf,
  SITE_MAP_HEIGHT,
  SITE_PIN_PLACEMENT,
  type SitePinMapProps,
  sitePinOf,
} from './SiteDetails.logic';

/**
 * The map with its pin, as one wide field of the form. Until a pin stands it is a quiet box that
 * says so. The bigger map draws the same map on the whole screen: the app's map is one node, so it
 * is drawn there while the bigger map is open and here while it is not.
 */
export function SitePinMap(props: SitePinMapProps) {
  const { room, form, pin, map, words } = props;
  const bigger = useRef<View>(null);
  const height = SITE_MAP_HEIGHT[room];
  return (
    <View style={styles.field}>
      <Text variant="field-label" color="secondary">
        {words.pinLabel[form.mount]}
      </Text>
      {form.pin === null ? (
        <View style={[styles.off, { height }]}>
          <ShellGlyph name="pin" size="md" />
          <Text variant="body-sm" color="secondary" align="center" style={styles.offWords}>
            {words.mapWaits}
          </Text>
        </View>
      ) : (
        <View>
          <MapSurface
            read={map.read}
            words={words.map}
            placement={SITE_PIN_PLACEMENT}
            pin={sitePinOf(form.mount, words)}
            controls={false}
            height={height}
            radius={theme.radius['r-field']}
            style={styles.surface}
          >
            {map.big ? null : map.tiles}
          </MapSurface>
          {/* The screen reader is sent here once the bigger map has closed. */}
          <View ref={bigger} collapsable={false} style={styles.bigger}>
            <IconButton label={words.biggerMap} disabled={props.saving} onClick={map.onBig}>
              <ShellGlyph name="expand" size="md" tone="primary" />
            </IconButton>
          </View>
        </View>
      )}
      {pin === null ? null : <PinLine {...props} pin={pin} />}
      {map.big && form.pin !== null ? (
        <SiteBigMap form={form} pin={pin} map={map} words={words} focusAfter={bigger} />
      ) : null}
    </View>
  );
}

/**
 * Under the map: where the pin stands — its figure in mono, where the reader's language puts it —
 * then how to move it, or that it was moved and the way back.
 */
function PinLine({ pin, pinMoved, map, saving, acts, words }: SitePinMapProps & { pin: string }) {
  const note = pinNoteOf(pinMoved, map.tiles !== null, words);
  return (
    <View style={styles.pinLine}>
      <Text variant="field-helper" color="secondary">
        {pinRunsOf(words, pin).map((run) =>
          run.mono ? (
            <Text key={run.text} variant="field-helper" color="primary" style={styles.figure}>
              {run.text}
            </Text>
          ) : (
            run.text
          ),
        )}
      </Text>
      {note === null ? null : (
        <Text variant="field-helper" color="secondary" style={styles.pinWord}>
          {note}
        </Text>
      )}
      {pinMoved ? (
        <Button variant="ghost" size="sm" disabled={saving} onClick={acts.onPutBack}>
          {words.putBack}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.spacing['sp-2'] },
  /* The map is a field of the form: the field's corner and a hairline, no lift — and with no
     elevation of its own, Android draws the button laid over it above it. */
  surface: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: colors['line-strong'],
  },
  bigger: {
    position: 'absolute',
    top: theme.spacing['sp-3'],
    right: theme.spacing['sp-3'],
    zIndex: 4,
  },
  /* No pin yet: a quiet sunken box of the map's height that says what will show here. */
  off: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-field'],
    borderWidth: 1,
    borderColor: colors['line-strong'],
    backgroundColor: colors['canvas-sunken'],
  },
  offWords: { flexShrink: 1 },
  pinLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: theme.spacing['sp-2'],
  },
  pinWord: { flexShrink: 1 },
  figure: { fontFamily: theme.type.families.mono },
});
