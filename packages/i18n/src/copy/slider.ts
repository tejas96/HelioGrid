/**
 * The words `Slider` (`packages/ui`) says on its own: its steppers' names, which carry the slider's
 * label, or name the bare value when it has none.
 */
import type { Translator } from '../runtime';

const SLIDER = {
  decrease: /*i18n*/ { id: 'Decrease {name}' },
  increase: /*i18n*/ { id: 'Increase {name}' },
  decreaseValue: /*i18n*/ { id: 'Decrease value' },
  increaseValue: /*i18n*/ { id: 'Increase value' },
} as const;

/** Every word `Slider` says on its own, in the reader's language. */
export function sliderWords(t: Translator['t']) {
  return {
    decrease: (name?: string) =>
      name === undefined ? t(SLIDER.decreaseValue) : t(SLIDER.decrease, { name }),
    increase: (name?: string) =>
      name === undefined ? t(SLIDER.increaseValue) : t(SLIDER.increase, { name }),
  };
}
