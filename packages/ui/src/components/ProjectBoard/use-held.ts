import { useRef, useState } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import type { Held } from './ProjectBoard.logic';

/**
 * One card's held-back rows: shut until *Show more* lets them in, and the first row it lets in, where
 * the focus lands once the button has gone.
 */
export function useHeld(): Held {
  const [open, setOpen] = useState(false);
  const reveal = useRef<FocusHandle>(null);
  return { open, onMore: () => setOpen(true), reveal };
}
