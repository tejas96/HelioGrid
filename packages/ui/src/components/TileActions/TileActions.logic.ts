import type { TranslatedText } from '@heliogrid/contracts';
import type { TileActionProps } from './TileActions.types';

/** The pill's word: the on word while on, where the action has one; its own word otherwise. */
export function tileActionWord({
  label,
  onLabel,
  on,
}: Pick<TileActionProps, 'label' | 'onLabel' | 'on'>): TranslatedText {
  return on && onLabel ? onLabel : label;
}

/** A toggle announces whether it is on; an action given no `on` is a plain act and says nothing. */
export function tileActionState(on: boolean | undefined): { selected: boolean } | undefined {
  return on === undefined ? undefined : { selected: on };
}
