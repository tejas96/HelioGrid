import { useState } from 'react';

/** One folded row open at a time: opening one folds the other, pressing the open one folds it. */
export function useOpenFold<Fold extends string>(initial: Fold | null = null) {
  const [open, setOpen] = useState<Fold | null>(initial);
  return {
    isOpen: (fold: Fold): boolean => open === fold,
    toggle: (fold: Fold) => () => setOpen((now) => (now === fold ? null : fold)),
    show: (fold: Fold) => setOpen(fold),
  };
}
