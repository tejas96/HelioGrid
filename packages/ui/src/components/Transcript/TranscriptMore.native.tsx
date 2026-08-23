/* The reveal control (native). ONE TARGET, TWO SOURCES: while the component still holds turns it
   has not shown, pressing it widens the window; once it has shown them all, it asks the caller for
   the next page. The word on it says which. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { TranscriptPlainButton } from './TranscriptChrome.native';

const styles = StyleSheet.create({
  more: { flexDirection: 'row', marginTop: theme.spacing['sp-3'] },
});

interface TranscriptMoreProps {
  /** Turns already handed over but not yet shown. Above zero, the press is local. */
  remaining: number;
  loadingMore: boolean;
  onReveal: () => void;
  onLoadMore?: () => void;
}

export function TranscriptMore({
  remaining,
  loadingMore,
  onReveal,
  onLoadMore,
}: TranscriptMoreProps) {
  return (
    <View style={styles.more}>
      <TranscriptPlainButton
        disabled={loadingMore}
        onPress={() => {
          if (remaining > 0) {
            onReveal();
          } else {
            onLoadMore?.();
          }
        }}
      >
        {loadingMore
          ? 'Loading…'
          : remaining > 0
            ? `Show the rest of the call · ${remaining} more`
            : 'Show more of the call'}
      </TranscriptPlainButton>
    </View>
  );
}
