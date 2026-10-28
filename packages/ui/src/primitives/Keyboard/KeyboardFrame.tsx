import type { KeyboardFrameProps } from './Keyboard.types';

/**
 * The web half draws its children as they are: a browser scrolls the focused field into view
 * itself, and no web page holds an act bar over an on-screen keyboard.
 */
export function KeyboardFrame({ children, foot }: KeyboardFrameProps) {
  return (
    <>
      {children}
      {foot}
    </>
  );
}
