import type { ReadKind } from '@heliogrid/domain';
import { type RefObject, useEffect, useRef } from 'react';
import { type FocusHandle, landFocusOn } from '../../primitives/FocusAfter';

/**
 * The teaching card's heading, which takes focus when the last waiting lead leaves — given, binned
 * or assigned in bulk — since the deck that held the pressed act leaves with it and focus would
 * fall to the page's start (`ui-adherence.md`, *States, saves and focus*). An inbox that opens
 * empty moves nothing; a re-read on the way keeps what was shown.
 */
export function useTeachingFocus(kind: ReadKind): RefObject<FocusHandle | null> {
  const heading = useRef<FocusHandle>(null);
  const queueShown = useRef(false);
  useEffect(() => {
    if (kind === 'ready') queueShown.current = true;
    if (kind !== 'empty') return;
    if (queueShown.current) landFocusOn(heading);
    queueShown.current = false;
  }, [kind]);
  return heading;
}
