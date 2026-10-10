import { createElement, type ReactElement } from 'react';
import {
  type Control,
  Controller,
  type FieldError,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from 'react-hook-form';

/** What one field holds when its words are written: its own value, and its own answer to a press. */
export interface BoundFieldState<Value> {
  value: Value;
  error: FieldError | undefined;
}

/**
 * Binds a form's fields one at a time for a component that draws them but may not import this
 * package: the binder a screen hands in. Each call returns that field's own `Controller`, which
 * hands `draw` the field's value, its change and the words `wordsOf` writes for it. The binding
 * subscribes to that field alone: a controlled native input whose value lags the keyboard drops
 * characters, so a keystroke re-renders one input, never the step around it.
 */
export function fieldBinder<Values extends FieldValues, Words, Transformed = Values>(
  control: Control<Values, unknown, Transformed>,
  wordsOf: <Name extends FieldPath<Values>>(
    name: Name,
    field: BoundFieldState<FieldPathValue<Values, Name>>,
  ) => Words,
) {
  return <Name extends FieldPath<Values>>(
    name: Name,
    draw: (
      field: {
        value: FieldPathValue<Values, Name>;
        onChange: (value: FieldPathValue<Values, Name>) => void;
      } & Words,
    ) => ReactElement,
  ): ReactElement =>
    createElement(Controller<Values, Name, Transformed>, {
      control,
      name,
      render: ({ field, fieldState }) =>
        draw({
          value: field.value,
          onChange: field.onChange,
          ...wordsOf(name, { value: field.value, error: fieldState.error }),
        }),
    });
}
