import { EmptyState } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from './styles';

/**
 * Shared scaffold — keeps the navigator non-empty while real screens are built.
 * Replaced screen-by-screen with the designed implementation.
 * Temporary copy exemption: the i18n track wraps this when the real screens are designed.
 */
export function PlaceholderScaffold({ name }: { name: string }) {
  return (
    <View style={styles.root}>
      <EmptyState title={name} description={PLACEHOLDER_NOTE} />
    </View>
  );
}

const PLACEHOLDER_NOTE = 'Placeholder route. The screen is not built yet.';
