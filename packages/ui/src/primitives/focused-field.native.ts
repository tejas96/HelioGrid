import { type HostInstance, TextInput } from 'react-native';

/** Where the focused field sits in the scroll's content: its top and height. */
export type FocusedFieldMeasured = (top: number, height: number) => void;

/**
 * Measures the field that holds the keyboard's focus against a scroll view: the answer is the
 * field's place in the scroll's content, so it does not move while the scroll does. Nothing is
 * told when no field holds the focus or the field is not inside that scroll (a page under the one
 * in front).
 */
export function measureFocusedField(scroll: HostInstance, measured: FocusedFieldMeasured): void {
  const field = TextInput.State.currentlyFocusedInput();
  field?.measureLayout(
    scroll,
    (_x, top, _width, height) => measured(top, height),
    () => {},
  );
}
