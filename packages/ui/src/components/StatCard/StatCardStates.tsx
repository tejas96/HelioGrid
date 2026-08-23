/* StatCard's four unresolved states (web). None of them prints a figure — a placeholder number
   presented as a real one is the exact failure F8-01 exists to prevent. `loading` puts a shimmer in
   the value's own footprint, so nothing reflows when the figure lands. */

import { Pressable } from '../../primitives/Pressable';
import type { SurfaceState } from '../UnavailableNote';
import { UnavailableNote } from '../UnavailableNote';

function Shimmer({ bar }: { bar: 'value' | 'meta' }) {
  return <span className="hg-stat-card-shimmer" data-bar={bar} />;
}

export function StatCardStates({
  state,
  label,
  emptyMessage,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: {
  state: SurfaceState;
  label: string;
  emptyMessage: string;
  errorMessage: string;
  onRetry?: () => void;
  unavailableTitle: string;
  unavailableMessage?: string;
}) {
  if (state === 'loading') {
    return (
      <div role="status" aria-label={`Loading ${label}`} className="hg-stat-card-loading">
        <Shimmer bar="value" />
        <Shimmer bar="meta" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="hg-stat-card-error">
        <p className="hg-stat-card-error-body">{errorMessage}</p>
        {onRetry ? (
          <Pressable className="hg-stat-card-retry" onPress={onRetry}>
            Try again
          </Pressable>
        ) : null}
      </div>
    );
  }
  if (state === 'unavailable') {
    return (
      <div className="hg-stat-card-unavailable">
        <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
      </div>
    );
  }
  if (state === 'empty') {
    return <p className="hg-stat-card-empty">{emptyMessage}</p>;
  }
  return null;
}
