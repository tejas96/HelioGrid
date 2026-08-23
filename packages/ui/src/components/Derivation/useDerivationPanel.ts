import { useContext, useEffect, useId, useState } from 'react';
import type { DerivationProps } from './Derivation.types';
import { partsKey } from './Derivation.types';
import { DerivationGroupContext } from './DerivationGroup.context';

interface PanelState {
  panelId: string;
  isOpen: boolean;
  toggle: () => void;
  /** True while the enclosing group is going to print the appendix instead of this panel. */
  screenOnly: boolean;
}

/**
 * One panel's open state, shared by both platform halves.
 *
 * A controlled `open` always wins; otherwise the enclosing group owns it (single-open by default,
 * so opening the fortieth closes the thirty-ninth), and a panel with no group owns it locally.
 */
export function useDerivationPanel({
  parts,
  label,
  summary,
  open,
  defaultOpen = false,
  onToggle,
  id,
}: Pick<
  DerivationProps,
  'parts' | 'label' | 'summary' | 'open' | 'defaultOpen' | 'onToggle' | 'id'
>): PanelState {
  const generatedId = useId();
  const myId = id ?? generatedId;
  const group = useContext(DerivationGroupContext);
  const [local, setLocal] = useState(defaultOpen);

  const isOpen = open ?? (group === null ? local : group.isOpen(myId));
  const key = partsKey(parts);
  const labelKey = typeof label === 'string' ? label : '';
  const register = group?.register;
  const unregister = group?.unregister;

  /* Registered for the print appendix. Serialised deps, so an inline `parts` array cannot loop. */
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` and `labelKey` ARE the deps — they are the serialised identities of `parts`, `label` and `summary`, and depending on those values directly re-registers on every render because a caller writes `parts={[…]}` inline.
  useEffect(() => {
    if (register === undefined || unregister === undefined) return;
    register(myId, { label, parts, summary });
    return () => unregister(myId);
  }, [register, unregister, myId, key, labelKey]);

  const toggle = () => {
    const next = !isOpen;
    onToggle?.(next);
    if (open !== undefined) return;
    if (group === null) setLocal(next);
    else group.setOpen(myId, next);
  };

  return {
    panelId: `${myId}-panel`,
    isOpen,
    toggle,
    screenOnly: group?.printAppendix === true,
  };
}
