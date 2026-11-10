import { Button } from '../Button';
import { FailedRead } from '../EmptyState';
import { LoadingBars } from '../LoadingBars';
import { UnavailableNote } from '../UnavailableNote';
import type { LeadDetailStatesProps } from './LeadDetailStates.types';

/** Lead Detail's wait, failure or honest landing on the web (`SCR-M02-04`). */
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
