import type { FieldBoxDensity, FieldBoxState, FieldBoxTone } from './FieldBox.types';

/** Spread on the element that IS the field's box — a shell `div`, or the `input` itself. */
export interface FieldBoxAttributes {
  'data-field-box': FieldBoxDensity;
  'data-fb-focused'?: 'true';
  'data-fb-tone'?: Exclude<FieldBoxTone, 'none'>;
  'data-fb-disabled'?: 'true';
}

/**
 * The well's attributes; `FieldBox.css` draws from them. Attributes rather than a wrapper element,
 * so no field gains a node, a size or a layout — only its colour and rings move here.
 */
export function fieldBox({
  focused,
  tone = 'none',
  disabled = false,
  density,
}: FieldBoxState): FieldBoxAttributes {
  return {
    'data-field-box': density,
    ...(focused ? { 'data-fb-focused': 'true' } : {}),
    ...(tone === 'none' ? {} : { 'data-fb-tone': tone }),
    ...(disabled ? { 'data-fb-disabled': 'true' } : {}),
  };
}
