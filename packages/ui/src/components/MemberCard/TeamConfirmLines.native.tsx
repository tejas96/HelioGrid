/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TeamConfirmWords } from './MemberCard.types';

/**
 * A confirm's lines: what the act does, quiet, then — on a roles removal — the way back, with its
 * lead in bold (`SCR-M01-13` m-confirm). Either may be absent; nothing is drawn for one that is.
 */
export function TeamConfirmLines({ body, note }: Pick<TeamConfirmWords, 'body' | 'note'>) {
  return (
    <View style={styles.lines}>
      {body === undefined ? null : (
        <Text variant="body-sm" color="secondary">
          {body}
        </Text>
      )}
      {note === undefined ? null : (
        <Text variant="body-sm">
          <Text variant="body-sm" bold>
            {note.lead}
          </Text>
          {note.rest}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lines: { gap: theme.spacing['sp-3'] },
});
