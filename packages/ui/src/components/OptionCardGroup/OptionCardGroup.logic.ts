import type { TranslatedText } from '@heliogrid/contracts';
import type {
  OptionCardGroupMode,
  OptionCardGroupProps,
  OptionCardItem,
} from './OptionCardGroup.types';

/** Whether an option is picked, in either mode. */
export function isPicked(props: OptionCardGroupProps, value: string): boolean {
  return props.mode === 'multiple' ? props.value.includes(value) : props.value === value;
}

/** What a press on an option hands to `onChange`: the one value, or the set with it toggled. */
export function pressOption(props: OptionCardGroupProps, value: string): void {
  if (props.mode !== 'multiple') {
    props.onChange?.(value);
    return;
  }
  const picked = props.value.includes(value);
  props.onChange?.(picked ? props.value.filter((v) => v !== value) : [...props.value, value]);
}

/** The word an option's *current* pill carries — its own, else the group's; none when not current. */
export function currentWord(
  option: OptionCardItem,
  groupWord: TranslatedText | undefined,
): TranslatedText | undefined {
  return option.current === true ? (option.currentLabel ?? groupWord) : undefined;
}

/** The card's role: a radio in a single group, a checkbox in a multiple one. */
export function optionRole(mode: OptionCardGroupMode): 'checkbox' | 'radio' {
  return mode === 'multiple' ? 'checkbox' : 'radio';
}
