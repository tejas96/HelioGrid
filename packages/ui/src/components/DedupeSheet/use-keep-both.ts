import { useEffect, useState } from 'react';

/**
 * *Keep both*'s reason box: whether it is open and what has been typed in it. A sheet opened again
 * for another capture starts with the box shut and empty, so one capture's reason never carries
 * into the next.
 */
export function useKeepBoth(open: boolean) {
  const [shown, setShown] = useState(false);
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) return;
    setShown(false);
    setReason('');
  }, [open]);
  return { shown, toggle: () => setShown((was) => !was), reason, setReason };
}
