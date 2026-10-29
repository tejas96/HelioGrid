/* StatCard's four unresolved states (web). None of them prints a figure — a placeholder number
   presented as a real one is the exact failure F8-01 exists to prevent. `loading` puts a shimmer in
   the value's own footprint, so nothing reflows when the figure lands. */

import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import type { StatCardStatesProps } from './StatCard.types';

function Shimmer({ bar }: { bar: 'value' | 'meta' }) {
  return <span className="hg-stat-card-shimmer" data-bar={bar} />;
}

export function StatCardStates({
  state,
  loadingLabel,
  emptyMessage,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
}: StatCardStatesProps) {
  if (state === 'loading') {
    return (
      <div role="status" aria-label={loadingLabel} className="hg-stat-card-loading">
        <Shimmer bar="value" />
        <Shimmer bar="meta" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="hg-stat-card-error">
        <p className="hg-stat-card-error-body">{errorMessage}</p>
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
      </div>
    );
  }
  if (state === 'unavailable') {
    return (
      <div className="hg-stat-card-unavailable">
        {unavailableTitle !== undefined ? (
          <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
        ) : null}
      </div>
    );
  }
  if (state === 'empty') {
    return <p className="hg-stat-card-empty">{emptyMessage}</p>;
  }
  return null;
}
