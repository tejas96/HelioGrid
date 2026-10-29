import type { TranslatedText } from '@heliogrid/contracts';
import { EmptyState } from '@heliogrid/ui';
import { View } from 'react-native';
import { styles } from './styles';

/**
 * Shared scaffold — keeps the navigator non-empty while real screens are built.
 * Replaced screen-by-screen with the designed implementation.
 */
export function PlaceholderScaffold({
  title,
  description,
}: {
  title: TranslatedText;
  description: TranslatedText;
}) {
  return (
    <View style={styles.root}>
      <EmptyState title={title} description={description} />
    </View>
  );
}
