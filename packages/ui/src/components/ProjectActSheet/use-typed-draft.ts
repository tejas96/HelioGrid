import { useState } from 'react';
import { typedOf } from './ProjectActSheet.logic';

/**
 * A form's typed words: the field as it is typed — inert while the send is out — and the value
 * they make, trimmed, with an empty field none.
 */
export function useTypedDraft(
  start: string,
  sending: boolean,
): {
  readonly field: {
    readonly value: string;
    readonly onChange: (typed: string) => void;
    readonly disabled: boolean;
  };
  readonly typed: string | null;
} {
  const [value, setValue] = useState(start);
  return { field: { value, onChange: setValue, disabled: sending }, typed: typedOf(value) };
}
