import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { RetryButton } from '../Button/RetryButton.native';
import { StateRegion } from '../StateBody/StateRegion.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { MapSkeleton } from './MapSkeleton.native';
import { mapNoteOf } from './MapSurface.logic';
import type { MapNoteProps, MapStateLayerProps, MapUnavailableProps } from './MapSurface.types';

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: theme.spacing['sp-6'],
    backgroundColor: colors['surface-alt'],
  },
  /* The `unavailable` plate. It holds NOTHING but a centred UnavailableNote — the fourth state
     has one renderer and this surface does not draw a second one. */
  region: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors['surface-alt'],
  },
});

/**
 * A failed tile fetch is `error` and offers a retry; nothing to show yet is `empty` and does
 * not. Neither ever leaves blank space that reads as "no sites".
 */
export function MapNote({ kind, title, message, onRetry, retry }: MapNoteProps) {
  return (
    <StateRegion
      tone={kind === 'empty' ? undefined : 'warning'}
      glyph="map"
      title={title}
      message={message}
      action={
        retry === undefined ? null : (
          <RetryButton onRetry={onRetry} label={retry.label} focusAfter={retry.focusAfter} />
        )
      }
      style={styles.note}
    />
  );
}

/** Every state that replaces the tiles, in one place. `ready` draws nothing here. */
export function MapStateLayer(props: MapStateLayerProps) {
  if (props.state === 'loading') {
    return <MapSkeleton label={props.words.loading} />;
  }
  if (props.state === 'unavailable') {
    return <MapUnavailable title={props.unavailableTitle} message={props.unavailableMessage} />;
  }
  const note = mapNoteOf(props);
  return note === null ? null : <MapNote {...note} />;
}

/**
 * The fourth state. `UnavailableNote` is the system's ONE renderer of it — this layer supplies
 * only the full-bleed plate the note is centred on, exactly as the design system's MapSurface
 * composes it. No retry ever grows here: retrying cannot conjure tile coverage.
 */
export function MapUnavailable({ title, message }: MapUnavailableProps) {
  return (
    <View style={styles.region}>
      <UnavailableNote variant="region" title={title} message={message} />
    </View>
  );
}
