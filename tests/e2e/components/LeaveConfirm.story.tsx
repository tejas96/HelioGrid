import type { LeaveConfirmProps } from '@heliogrid/ui';
import { LeaveConfirm } from '@heliogrid/ui';
import { useState } from 'react';

/**
 * The leave confirm as a page holds it: open until answered. The frame counts each answer as
 * `data-kept` and `data-left`, since a handler handed to `mount` answers from the test process.
 */
type LeaveWords = Pick<LeaveConfirmProps, 'title' | 'body' | 'discard' | 'keep'>;

export function LeaveConfirmAsHeld(words: LeaveWords) {
  const [kept, setKept] = useState(0);
  const [left, setLeft] = useState(0);
  return (
    <div data-kept={kept} data-left={left} style={{ position: 'relative', minHeight: '100dvh' }}>
      <LeaveConfirm
        open
        {...words}
        onKeep={() => setKept((count) => count + 1)}
        onLeave={() => setLeft((count) => count + 1)}
      />
    </div>
  );
}
