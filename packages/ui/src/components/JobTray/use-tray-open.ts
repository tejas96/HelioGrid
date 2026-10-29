import { useCallback, useState } from 'react';

/**
 * The tray is open by the caller's `open` when it gives one, else by its own state; every change is
 * reported through `onOpenChange` either way.
 */
export function useTrayOpen(
  open: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): [boolean, (next: boolean) => void] {
  const [innerOpen, setInnerOpen] = useState(false);
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) {
        setInnerOpen(next);
      }
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  return [open ?? innerOpen, setOpen];
}
