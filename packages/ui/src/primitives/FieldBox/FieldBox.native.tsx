import { theme } from '@heliogrid/theme';
import type { TextStyle, ViewStyle } from 'react-native';
import type { FieldBoxState, FieldBoxTone } from './FieldBox.types';

/**
 * The ring sits ON the well's edge, inside it (`F7-24`; the design system's 1.5px inset ring): a
 * ring outside would pad every box, and the code row — six 48px cells and five 8px gaps — would
 * outgrow a 375px screen. The edge is always drawn, transparent at rest, so the text never shifts
 * when focus arrives.
 */
const EDGE = 1.5;

/** For a field whose padding must hold its text where it was: subtract this from the padding. */
export const FIELD_BOX_EDGE = EDGE;

/**
 * A placeholder is a hint, so it is `text-tertiary` (4.71:1 on the well); on the disabled well
 * tertiary is at the floor's edge, so there it steps up to `text-secondary`, as a value does.
 */
export function fieldBoxPlaceholder(disabled: boolean): string {
  return theme.colors[`text-${fieldWords(true, disabled)}`];
}

/**
 * The `Text` colour of a field that draws its value as words, not a `TextInput` — a picker's
 * trigger: the placeholder a hint, as `fieldBoxPlaceholder`; a disabled value stays readable.
 */
export function fieldWords(
  isPlaceholder: boolean,
  disabled: boolean,
): 'primary' | 'secondary' | 'tertiary' {
  if (disabled) return 'secondary';
  return isPlaceholder ? 'tertiary' : 'primary';
}

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
    backgroundColor: disabled ? theme.colors['canvas-sunken'] : theme.colors.fill,
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

/* One edge, so one colour, as on the web: focus wins while the caret is in, even in error (F7-24:
   focus is never removed); the error's words stay under the field and the red edge returns on blur. */
function edgeColor(focused: boolean, tone: FieldBoxTone): string {
  if (focused) {
    return theme.colors.accent;
  }
  if (tone === 'error') {
    return theme.colors.danger;
  }
  // The well's own ground shows through, disabled or not — a coloured rest edge would outline it.
  return 'transparent';
}
