import { Text, View } from 'react-native';
import { styles } from './styles';

/**
 * A route that exists so the navigator has a screen to mount, and nothing more.
 *
 * The v1 UI was removed on 2026-08-19 (docs/17-ui-architecture-v2.md). React Navigation
 * throws when a group resolves to zero screens, so the route map needs a body while the
 * new design system is built. Uses react-native primitives ONLY — no tokens, no theme,
 * no component library. Replaced screen-by-screen; do not build on it.
 */
export function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.note}>{PLACEHOLDER_NOTE}</Text>
    </View>
  );
}

const PLACEHOLDER_NOTE = 'Placeholder route. The screen is not built yet.';
