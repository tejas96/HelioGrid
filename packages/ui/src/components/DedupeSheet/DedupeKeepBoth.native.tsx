import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Button } from '../Button/Button.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import { Textarea } from '../Textarea/Textarea.native';
import { actLineOf, isActWaiting, keepBothConfirmOf } from './DedupeSheet.logic';
import type { DedupeKeepBothProps } from './DedupeSheet.types';

/**
 * *Keep both*'s reason box (`M02-12`): the reason commits as it is typed, and the confirm sleeps
 * until there is one. Its wait and its failure show under the confirm, where the person acted.
 */
export function DedupeKeepBoth(props: DedupeKeepBothProps) {
  const { reason, onReason, act, words } = props;
  const waiting = isActWaiting(act);
  const line = actLineOf('keep_both', act, words);
  return (
    <View style={styles.reason}>
      <Textarea
        label={words.reasonLabel}
        placeholder={words.reasonPlaceholder}
        value={reason}
        onChange={onReason}
        rows={2}
        disabled={waiting}
      />
      <Button variant="secondary" fullWidth {...keepBothConfirmOf(props)}>
        {words.keepBothConfirm}
      </Button>
      {line === null ? null : <PendingAction {...line} />}
    </View>
  );
}

const styles = StyleSheet.create({
  reason: {
    gap: theme.spacing['sp-3'],
    padding: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-tile'],
    backgroundColor: colors.fill,
  },
});
