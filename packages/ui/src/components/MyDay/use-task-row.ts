import type { MyDayItem } from '@heliogrid/contracts';
import { type ReactNode, useEffect, useState } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { MenuItem } from '../Menu/Menu.types';
import { leadActOf, type MyDayLeadAct, nameOf, rowMenuItemsOf } from './MyDay.logic';
import type { MyDayProps } from './MyDay.types';

/** What one task row draws on both halves: who, its act, its menu, and its tick's state. */
export interface TaskRowState {
  readonly name: string;
  readonly act: MyDayLeadAct;
  readonly menu: MenuItem[];
  readonly ticked: boolean;
  readonly busy: boolean;
  /** The tick: fills at once, then the row leaves with the next read. */
  readonly tick: () => void;
  readonly open: { readonly name: string; readonly onOpen: () => void };
}

/**
 * One task row's state, shared by both halves. `leaving` is the half's own focus handle
 * (`useFocusAfter`), so focus lands on the screen's `focusAfter` once the row is gone; `glyph` the
 * half's own glyph for the menu's items. A tick the
 * server refused is undone on screen, so the row can be ticked again (gap 20).
 */
export function useTaskRow(
  props: MyDayProps,
  item: MyDayItem,
  leaving: (act: () => void) => () => void,
  glyph: (name: ShellGlyphName) => ReactNode,
): TaskRowState {
  const [ticked, setPressed] = useState(false);
  /* A refused tick is the row's own to undo: the failure clears as soon as any other act starts. */
  useEffect(() => {
    if (props.failed) setPressed(false);
  }, [props.failed]);
  const name = nameOf(item, props.words);
  return {
    name,
    act: leadActOf(item, props),
    menu: rowMenuItemsOf(item, props, glyph),
    ticked,
    busy: ticked && props.sending,
    tick: leaving(() => {
      setPressed(true);
      props.onDone(item);
    }),
    open: { name: props.words.open(name), onOpen: () => props.onOpen(item) },
  };
}
