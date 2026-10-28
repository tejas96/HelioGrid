import type { KeyboardHostProps } from './Keyboard.types';

/** The web has no on-screen keyboard to host. */
export function KeyboardHost({ children }: KeyboardHostProps) {
  return <>{children}</>;
}
