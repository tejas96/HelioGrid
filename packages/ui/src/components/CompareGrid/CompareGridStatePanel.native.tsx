import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import type { CompareGridProps } from './CompareGrid.types';
import { CompareMessage, CompareSkeleton } from './CompareGridStates.native';

export interface CompareGridStatePanelProps {
  state: NonNullable<CompareGridProps['state']>;
  emptyTitle: string;
  emptyMessage: string;
  errorTitle: string;
  errorMessage: string;
  onRetry?: () => void;
  unavailableTitle: string;
  unavailableMessage?: string;
}

/**
 * **Which surface state the reader is in, and the panel that stands in for the grid.**
 *
 * The one place that decides between the four blocked states, so neither platform's shell has to
 * carry the ladder: the shell asks whether there is a grid to draw, this says what goes there
 * instead.
 */
export function CompareGridStatePanel({
  state,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: CompareGridStatePanelProps) {
  if (state === 'loading') return <CompareSkeleton />;
  if (state === 'error') {
    return (
      <CompareMessage tone="warning" title={errorTitle} message={errorMessage} onRetry={onRetry} />
    );
  }
  if (state === 'unavailable') {
    /* THE FOURTH STATE, and `UnavailableNote` is the system's one renderer of it: this was never
       going to be here, so the mark is a slashed circle rather than the two-column glyph of a
       comparison that could still arrive, and there is NO RETRY, EVER. `region` is the variant for
       the centred body of a surface, which is what stands in for the grid. */
    return (
      <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
    );
  }
  /* `empty`, and equally `ready` with nothing to line up — the same nothing, so the same words. */
  return <CompareMessage title={emptyTitle} message={emptyMessage} />;
}
