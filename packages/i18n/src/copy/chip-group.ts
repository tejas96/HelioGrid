/**
 * A chip group's "+N" control (`ChipGroup`, `packages/ui`'s `ChipGroupWords`): its visible words
 * once open, and its spoken name either way, with the group's own noun in them.
 */
import type { Translator } from '../runtime';

const CHIP_GROUP = {
  showFewer: /*i18n*/ { id: 'Show fewer' },
  showFewerOf: /*i18n*/ { id: 'Show fewer {noun}' },
  showMoreOf: /*i18n*/ { id: 'Show {hidden} more {noun} ({total} in total)' },
} as const;

/** The "+N" control's words for a group of `noun` — the same word the group takes as its `label`. */
export function chipGroupWords(t: Translator['t'], noun: string) {
  return {
    showFewer: t(CHIP_GROUP.showFewer),
    showFewerSpoken: t(CHIP_GROUP.showFewerOf, { noun }),
    showMore: (hidden: number, total: number) => t(CHIP_GROUP.showMoreOf, { hidden, noun, total }),
  };
}
