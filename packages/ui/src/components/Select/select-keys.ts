import type { KeyboardEvent } from 'react';
import type { SelectOption } from './Select.types';
import { findByFirstLetter } from './select-options';

export interface SelectKeyContext {
  active: number;
  commit: (index: number) => void;
  options: readonly SelectOption[];
  setActive: (updater: (index: number) => number) => void;
  setOpen: (open: boolean) => void;
}

/** Closed: Enter, Space or ArrowDown opens it. Anything else stays the browser's. */
const OPENERS = ['Enter', ' ', 'ArrowDown'];

/** Open: the keys the listbox owns outright. Type-ahead is NOT one — a letter still types. */
const PREVENTED = ['Escape', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '];

/**
 * Up/Down/Home/End walk, Enter or Space commits, Esc cancels, and any single character jumps to
 * the first option starting with it. Focus never leaves the trigger — the walk moves a local index
 * the combobox points at with `aria-activedescendant`.
 */
function applyOpenKey(key: string, ctx: SelectKeyContext): void {
  const last = ctx.options.length - 1;
  if (key === 'Escape') {
    ctx.setOpen(false);
  } else if (key === 'ArrowDown') {
    ctx.setActive((index) => Math.min(last, index + 1));
  } else if (key === 'ArrowUp') {
    ctx.setActive((index) => Math.max(0, index - 1));
  } else if (key === 'Home') {
    ctx.setActive(() => 0);
  } else if (key === 'End') {
    ctx.setActive(() => last);
  } else if (key === 'Enter' || key === ' ') {
    ctx.commit(ctx.active);
  } else if (key.length === 1) {
    const found = findByFirstLetter(ctx.options, key);
    if (found >= 0) {
      ctx.setActive(() => found);
    }
  }
}

/** The trigger's whole keyboard contract, in one place. */
export function handleSelectKey(
  event: KeyboardEvent<HTMLButtonElement>,
  open: boolean,
  ctx: SelectKeyContext,
): void {
  if (!open) {
    if (OPENERS.includes(event.key)) {
      event.preventDefault();
      ctx.setOpen(true);
    }
    return;
  }
  if (PREVENTED.includes(event.key)) {
    event.preventDefault();
  }
  applyOpenKey(event.key, ctx);
}
