import { Button } from '../Button';
import { PendingAction } from '../PendingAction';
import { Textarea } from '../Textarea';
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
    <div className="hg-dedupe-reason">
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
    </div>
  );
}
