import type { KeyboardEvent } from 'react';

/**
 * Web halves only: Enter and Space press an element that carries the button role, as they press a
 * native button. A pressable surface that holds other content cannot be a `button` element, so it
 * takes the role and this.
 */
export function pressOnEnterOrSpace(onPress: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress();
    }
  };
}
