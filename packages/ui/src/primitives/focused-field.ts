/** Where the focused field sits in the scroll's content: its top and height. */
export type FocusedFieldMeasured = (top: number, height: number) => void;

/**
 * The web half tells nothing: a browser scrolls the focused field into view itself, and the web's
 * pages hold no act bar over the keyboard.
 */
export function measureFocusedField(_scroll: object, _measured: FocusedFieldMeasured): void {}
