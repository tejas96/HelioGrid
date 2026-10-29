/* The reveal control (native). ONE TARGET, TWO SOURCES: while the component still holds turns it
   has not shown, pressing it widens the window; once it has shown them all, it asks the caller for
   the next page. The word on it says which. */

import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button.native';
import { moreLabelOf, morePressOf } from './Transcript.logic';
import type { TranscriptWords } from './Transcript.types';

const styles = StyleSheet.create({
  more: { flexDirection: 'row', marginTop: theme.spacing['sp-3'] },
});

interface TranscriptMoreProps {
  /** Turns already handed over but not yet shown. Above zero, the press is local. */
  remaining: number;
  loadingMore: boolean;
  onReveal: () => void;
  onLoadMore?: () => void;
  words: TranscriptWords;
}

export function TranscriptMore({
  remaining,
  loadingMore,
  onReveal,
  onLoadMore,
  words,
}: TranscriptMoreProps) {
  return (
    <View style={styles.more}>
      <Button
        variant="secondary"
        size="md"
        disabled={loadingMore}
        onClick={morePressOf(remaining, onReveal, onLoadMore)}
      >
        {moreLabelOf(words, remaining, loadingMore)}
      </Button>
    </View>
  );
}
