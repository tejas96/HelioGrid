import { useEffect, useRef } from 'react';
import { type FocusAfter, landFocusOn } from '../../primitives/FocusAfter';

/**
 * The one-tap assign takes its own card away once the waiting leads are given (`packages/ui`
 * CLAUDE.md, a control that removes itself): when a send it made comes back without failing, focus
 * lands on the dashboard, never on the page's body.
 */
export function useAssignLanding(assigning: boolean, failed: boolean, focusAfter: FocusAfter) {
  const wasAssigning = useRef(assigning);
  useEffect(() => {
    const finished = wasAssigning.current && !assigning;
    wasAssigning.current = assigning;
    if (finished && !failed) landFocusOn(focusAfter);
  }, [assigning, failed, focusAfter]);
}
