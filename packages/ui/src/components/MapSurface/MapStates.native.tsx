import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Circle, Path, Svg } from 'react-native-svg';
import { Icon } from '../../primitives/Icon/Icon.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { MapSkeleton } from './MapSkeleton.native';

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-6'],
    backgroundColor: theme.colors['surface-alt'],
  },
  mark: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  message: { maxWidth: 320 },
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
    backgroundColor: theme.colors['surface-alt'],
  },
  retry: {
    marginTop: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-5'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors.surface,
    // A control is raised, not outlined — `surface` at e2 (Q77).
    ...theme.elevation.e2,
  },
});

function stroke(d: string) {
  return (
    <Path
      d={d}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const ALERT = (
  <Svg viewBox="0 0 24 24" fill="none">
    {stroke('M12 9v4M12 17h.01')}
    <Circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} fill="none" />
  </Svg>
);

const EMPTY = (
  <Svg viewBox="0 0 24 24" fill="none">
    {stroke('M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z')}
    {stroke('M9 4v14M15 6v14')}
  </Svg>
);

interface MapNoteProps {
  kind: 'error' | 'empty';
  title: string;
  message: string;
  onRetry?: () => void;
}

/**
 * A failed tile fetch is `error` and offers a retry; nothing to show yet is `empty` and does
 * not. Neither ever leaves blank space that reads as "no sites".
 */
export function MapNote({ kind, title, message, onRetry }: MapNoteProps) {
  const empty = kind === 'empty';
  return (
    <View style={styles.note}>
      <View
        style={[
          styles.mark,
          {
            backgroundColor: empty ? theme.colors['neutral-bg'] : theme.colors['warning-bg'],
          },
        ]}
      >
        <Icon
          size="lg"
          color={empty ? theme.colors['text-tertiary'] : theme.colors['warning-text']}
        >
          {empty ? EMPTY : ALERT}
        </Icon>
      </View>
      <Text variant="h4" align="center">
        {title}
      </Text>
      <Text variant="body-sm" color="secondary" align="center" style={styles.message}>
        {message}
      </Text>
      {kind === 'error' && onRetry !== undefined ? (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text variant="body">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface MapUnavailableProps {
  title: string;
  message: string;
}

export interface MapStateLayerProps {
  state: 'ready' | 'loading' | 'empty' | 'error' | 'unavailable';
  emptyTitle: string;
  emptyMessage: string;
  unavailableTitle: string;
  unavailableMessage: string;
  errorTitle: string;
  errorMessage: string;
  onRetry?: () => void;
}

/** Every state that replaces the tiles, in one place. `ready` draws nothing here. */
export function MapStateLayer(props: MapStateLayerProps) {
  if (props.state === 'loading') {
    return <MapSkeleton />;
  }
  if (props.state === 'unavailable') {
    return <MapUnavailable title={props.unavailableTitle} message={props.unavailableMessage} />;
  }
  if (props.state === 'error') {
    return (
      <MapNote
        kind="error"
        title={props.errorTitle}
        message={props.errorMessage}
        onRetry={props.onRetry}
      />
    );
  }
  if (props.state === 'empty') {
    return <MapNote kind="empty" title={props.emptyTitle} message={props.emptyMessage} />;
  }
  return null;
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
