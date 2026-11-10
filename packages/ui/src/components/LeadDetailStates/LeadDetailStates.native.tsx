import { Button } from '../Button/Button.native';
import { FailedRead } from '../EmptyState/FailedRead.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { LeadDetailStatesProps } from './LeadDetailStates.types';

/** Lead Detail's wait, failure or honest landing on the phone (`SCR-M02-04`). */
export function LeadDetailStates({ read, words, onBackToList, focusAfter }: LeadDetailStatesProps) {
  if (read.kind === 'loading') {
    return <LoadingBars bars={['panel', 'control', 'panel', 'row', 'row']} label={words.loading} />;
  }
  if (read.kind === 'failed') {
    return (
      <FailedRead
        title={words.failedTitle}
        message={words.failedMessage}
        retryLabel={words.retry}
        onRetry={read.retry}
        focusAfter={focusAfter}
      />
    );
  }
  return (
    <UnavailableNote
      variant="region"
      title={words.goneTitle}
      message={words.goneMessage}
      action={
        <Button variant="secondary" size="lg" onClick={onBackToList}>
          {words.backToList}
        </Button>
      }
    />
  );
}
