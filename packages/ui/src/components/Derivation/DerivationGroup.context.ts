import type { ReactNode } from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';
import type { DerivationGroupProps, DerivationPart } from './Derivation.types';
import { partsKey } from './Derivation.types';

export interface DerivationEntry {
  id: string;
  label: ReactNode;
  summary: ReactNode;
  parts: DerivationPart[];
}

/**
 * What a `DerivationGroup` hands its panels: who is open, how to change that, and the print
 * register. One implementation for both platform halves, so the single-open law cannot diverge.
 */
export interface DerivationGroupContextValue {
  isOpen: (id: string) => boolean;
  setOpen: (id: string, next: boolean) => void;
  register: (id: string, entry: Omit<DerivationEntry, 'id'>) => void;
  unregister: (id: string) => void;
  /** True while the group prints one numbered appendix instead of forty inline panels. */
  printAppendix: boolean;
}

export const DerivationGroupContext = createContext<DerivationGroupContextValue | null>(null);

/**
 * The group's state. **The two modes differ in one line, which is the whole of `many`:** single
 * replaces the open set, many adds to it. Closing is identical, so no mode can leave a panel open
 * that was closed, and neither mode has an `openAll`.
 */
export function useDerivationGroup(
  mode: NonNullable<DerivationGroupProps['mode']>,
  printAs: NonNullable<DerivationGroupProps['printAs']>,
): { context: DerivationGroupContextValue; entries: DerivationEntry[] } {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<DerivationEntry[]>([]);

  const register = useCallback((id: string, data: Omit<DerivationEntry, 'id'>) => {
    setEntries((previous) => {
      const index = previous.findIndex((entry) => entry.id === id);
      const next: DerivationEntry = { id, ...data };
      if (index < 0) return [...previous, next];
      const current = previous[index];
      if (
        current !== undefined &&
        partsKey(current.parts) === partsKey(data.parts) &&
        current.label === data.label
      ) {
        return previous;
      }
      const copy = [...previous];
      copy[index] = next;
      return copy;
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  }, []);

  const setOpen = useCallback(
    (id: string, next: boolean) => {
      setOpenIds((previous) => {
        if (!next) return previous.filter((openId) => openId !== id);
        if (mode === 'single') return [id];
        return previous.includes(id) ? previous : [...previous, id];
      });
    },
    [mode],
  );

  const isOpen = useCallback((id: string) => openIds.includes(id), [openIds]);

  const context = useMemo<DerivationGroupContextValue>(
    () => ({ isOpen, setOpen, register, unregister, printAppendix: printAs === 'appendix' }),
    [isOpen, setOpen, register, unregister, printAs],
  );

  return { context, entries };
}
