import { theme } from '@heliogrid/theme';
import type { TextStyle, ViewStyle } from 'react-native';
import type { FieldBoxState, FieldBoxTone } from './FieldBox.types';

/**
 * The ring sits ON the well's edge here, with no gap (`F7-24`): a ring outside would pad every box
 * by 4px, and the code row — six 48px cells and five 8px gaps — would outgrow a 375px screen. The
 * edge is always drawn, transparent at rest, so the text never shifts when focus arrives.
 */
const EDGE = 2;

/** For a field whose padding must hold its text where it was: subtract this from the padding. */
export const FIELD_BOX_EDGE = EDGE;

/** Text inside a well is `text-secondary` or stronger — tertiary on the well is under the floor. */
export const FIELD_BOX_PLACEHOLDER = theme.colors['text-secondary'];

const DISABLED_TEXT: TextStyle = { color: theme.colors['text-secondary'] };

/**
 * The well's style for the view — or the `TextInput` — that IS the field's box. The field keeps
 * its own height, padding and layout.
 */
export function fieldBox({
  focused,
  tone = 'none',
  disabled = false,
  density,
}: FieldBoxState): ViewStyle {
  return {
    backgroundColor: disabled ? theme.colors['surface-form'] : theme.colors['bg-well'],
    borderRadius:
      density === 'functional'
        ? theme.radius['r-input-functional']
        : theme.radius['r-input-expressive'],
    borderWidth: EDGE,
    borderColor: edgeColor(focused, tone),
  };
}

/** A disabled field keeps its value readable; `undefined` leaves the field's own colour. */
export function fieldBoxText(disabled: boolean): TextStyle | undefined {
  return disabled ? DISABLED_TEXT : undefined;
}

/* One edge, so one colour: focus wins while the caret is in, and the error's words stay under the
   field; the red edge returns on blur. The web draws both rings at once. */
function edgeColor(focused: boolean, tone: FieldBoxTone): string {
  if (focused) {
    return theme.colors.accent;
  }
  if (tone === 'error') {
    return theme.colors.danger;
  }
  if (tone === 'success') {
    return theme.colors.success;
  }
  // The well's own ground shows through, disabled or not — a coloured rest edge would outline it.
  return 'transparent';
}
