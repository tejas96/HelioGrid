import type { OptionCardGroupProps } from './OptionCardGroup.types';

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
