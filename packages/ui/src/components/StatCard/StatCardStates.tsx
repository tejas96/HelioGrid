/* StatCard's four unresolved states (web). None of them prints a figure — a placeholder number
   presented as a real one is the exact failure F8-01 exists to prevent. `loading` puts a skeleton in
   the value's own footprint, so nothing reflows when the figure lands; the rest are `StateBody`. */

import { StateBody } from '../StateBody';
import type { StatCardStatesProps } from './StatCard.types';

export function StatCardStates({ state, loadingLabel, ...words }: StatCardStatesProps) {
  if (state === 'loading') {
    return (
      <div role="status" aria-label={loadingLabel} className="hg-stat-card-loading">
        <span className="hg-stat-card-shimmer hg-skeleton" data-bar="value" />
        <span className="hg-stat-card-shimmer hg-skeleton" data-bar="meta" />
      </div>
    );
  }
  if (state === 'ready') return null;
  return (
    <div className="hg-stat-card-state">
      <StateBody state={state} {...words} />
    </div>
  );
}
