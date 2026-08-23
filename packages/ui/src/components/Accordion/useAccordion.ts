import { useEffect, useRef, useState } from 'react';
import type { AccordionItem, AccordionProps } from './Accordion.types';

type Controller = Pick<
  AccordionProps,
  'items' | 'value' | 'onChange' | 'multiple' | 'defaultOpen' | 'openWithErrors'
>;

export interface AccordionState {
  /** The keys currently open, whether the accordion is controlled or not. */
  openList: string[];
  toggle: (key: string) => void;
}

const asList = (open: string | string[] | null | undefined): string[] => {
  if (Array.isArray(open)) return open;
  return open === null || open === undefined ? [] : [open];
};

const erroredKeys = (items: AccordionItem[]): string =>
  items
    .filter((item) => item.state === 'errors')
    .map((item) => item.key)
    .join('|');

/**
 * Open/closed, controlled or not — one implementation for both platforms.
 *
 * A section that **becomes** errored opens itself (`M07-19`): a system that refuses a save must not
 * then hide which of eight sections to fix. The effect is keyed on WHICH sections are errored, not
 * on the open list, so it reveals a new problem without fighting a user who has just closed one.
 */
export function useAccordion({
  items,
  value,
  onChange,
  multiple = false,
  defaultOpen = [],
  openWithErrors = true,
}: Controller): AccordionState {
  const [inner, setInner] = useState<string[]>(defaultOpen);
  const openList = value !== undefined ? asList(value) : inner;

  /* The effect below must read the CURRENT open list without depending on it. */
  const latest = useRef({ openList, value, onChange, multiple });
  latest.current = { openList, value, onChange, multiple };

  const commit = (next: string[]) => {
    const now = latest.current;
    if (now.value === undefined) setInner(next);
    now.onChange?.(now.multiple ? next : (next[0] ?? null));
  };

  const toggle = (key: string) => {
    const isOpen = openList.includes(key);
    if (multiple) {
      commit(isOpen ? openList.filter((k) => k !== key) : [...openList, key]);
      return;
    }
    commit(isOpen ? [] : [key]);
  };

  const errKeys = erroredKeys(items);
  /* Keyed on WHICH sections are errored, never on the open list: depending on the open list would
     re-open a section the user has just closed. The current list is read through `latest`. */
  useEffect(() => {
    if (!openWithErrors || errKeys === '') return;
    const errs = errKeys.split('|');
    const now = latest.current;
    const missing = errs.filter((key) => !now.openList.includes(key));
    const first = missing[0];
    if (first === undefined) return;
    if (now.value === undefined) setInner(now.multiple ? [...now.openList, ...missing] : [first]);
    now.onChange?.(now.multiple ? [...now.openList, ...missing] : first);
  }, [errKeys, openWithErrors]);

  return { openList, toggle };
}
