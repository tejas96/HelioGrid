/** The web shows no on-screen keyboard, so it is never up. */
export function useKeyboardUp(): boolean {
  return false;
}

/** The web shows no on-screen keyboard. */
export function useKeyboardHeight(): number {
  return 0;
}

/** The web half has no keyboard to lower. */
export function closeKeyboard(): void {}
