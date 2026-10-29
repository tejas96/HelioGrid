import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ChecklistGroup, ChecklistModel } from './Checklist.groups';
import type { ChecklistItem, ChecklistWords } from './Checklist.types';

/** The list's region name: its `label` when that is words alone, else the list's own name. */
export function checklistNameOf(label: ReactNode, words: ChecklistWords): string {
  return typeof label === 'string' ? label : words.name;
}

/** The count in words — the caller's own, else "12 of 47 steps done" in the items' noun. */
export function countLineOf(
  model: ChecklistModel,
  countWords: ReactNode,
  noun: TranslatedText | undefined,
  words: ChecklistWords,
): ReactNode {
  return countWords ?? words.count(model.done, model.list.length, noun);
}

/**
 * A row's key: its id, else the counted number — the item's position in the WHOLE list, so it is
 * unique across every group and no second count, and no array index, can disagree.
 */
export function rowKeyOf(
  item: ChecklistItem,
  group: ChecklistGroup,
  model: ChecklistModel,
): string | number {
  return item.id ?? `${group.key}-${String(model.numberFor(item))}`;
}

export interface StepState {
  done: boolean;
  /** A tick in flight: the box keeps its previous state while `item.pending` names the act. */
  waiting: boolean;
  /** The tick box's name — the item's title, and whether it is done. */
  tickLabel: TranslatedText;
}

export function stepStateOf(item: ChecklistItem, words: ChecklistWords): StepState {
  const done = item.done === true;
  return {
    done,
    waiting: Boolean(item.pending),
    tickLabel: words.tick(typeof item.title === 'string' ? item.title : '', done),
  };
}

/** An item's materials as one line, or `null` when it names none. */
export function materialsLineOf(item: ChecklistItem): string | null {
  return item.materials !== undefined && item.materials.length > 0
    ? item.materials.join(' · ')
    : null;
}
