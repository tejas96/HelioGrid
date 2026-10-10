import { createElement } from 'react';
import { Controller, type ControllerProps, createFormControl } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { fieldBinder } from '../src/field-binder';

interface Details {
  companyName: string;
  city: string;
}

/**
 * One binding per field: a bound field is handed its own value, its change and the words written
 * for its own value and error — a step that read every field would re-render on each keystroke.
 */
describe('fieldBinder', () => {
  const { control } = createFormControl<Details>({ defaultValues: { companyName: '', city: '' } });
  const drawn = createElement('input');

  it('binds the named field to the form it was given, through its own Controller', () => {
    const bound = fieldBinder(control, () => ({}))('city', () => drawn);
    const props = bound.props as ControllerProps<Details, 'city'>;
    expect(bound.type).toBe(Controller);
    expect(props.name).toBe('city');
    expect(props.control).toBe(control);
  });

  it('hands the field its value, its change and the words for its own value and error', () => {
    const wordsOf = vi.fn((name: keyof Details, field: { value: string }) => ({
      label: `${name} holds ${field.value}`,
    }));
    const draw = vi.fn(() => drawn);
    const bound = fieldBinder(control, wordsOf)('city', draw);
    const { render } = bound.props as ControllerProps<Details, 'city'>;
    const onChange = vi.fn();
    const error = { type: 'too_small', message: 'A city is needed' };
    const state = { field: { value: 'Pune', onChange }, fieldState: { error } };

    expect(render(state as unknown as Parameters<typeof render>[0])).toBe(drawn);
    expect(wordsOf).toHaveBeenCalledExactlyOnceWith('city', { value: 'Pune', error });
    expect(draw).toHaveBeenCalledExactlyOnceWith({
      value: 'Pune',
      onChange,
      label: 'city holds Pune',
    });
  });
});
