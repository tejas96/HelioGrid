import { useState } from 'react';
import type { ImportColumnsProps } from './Import.types';

/**
 * Which columns the person left out on this visit, for both halves of the columns step. A column
 * left out and one not yet placed both send no field; only this visit knows which the person chose,
 * so a left-out one reads *Leave this column out* rather than *Choose a field*, and is not waiting.
 */
export function useLeftOutColumns<Field extends string>(props: ImportColumnsProps<Field>) {
  const [leftOut, setLeftOut] = useState<ReadonlySet<number>>(new Set());
  const waiting = props.columns.open.filter(
    (view) => view.field === null && !leftOut.has(view.column),
  ).length;
  const place = (column: number, value: string) => {
    const field = props.fields.find((known) => known.value === value)?.value ?? null;
    setLeftOut((held) => {
      const next = new Set(held);
      if (field === null) next.add(column);
      else next.delete(column);
      return next;
    });
    props.onPlace(column, field);
  };
  return { leftOut, waiting, place };
}
