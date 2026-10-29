/**
 * `NumberField`'s own words (`packages/ui`'s `NumberFieldWords`): the stepper buttons' names, the
 * two lines a clamp states and the constraint a refusal states — authored once for both platforms.
 * A bound arrives as the field prints it, the figure and its unit ("0.3 m"), and each sentence is
 * one whole message around it.
 */
import type { Translator } from '../runtime';

const NUMBER_FIELD = {
  decrease: /*i18n*/ { id: 'Decrease {name}' },
  increase: /*i18n*/ { id: 'Increase {name}' },
  decreaseValue: /*i18n*/ { id: 'Decrease value' },
  increaseValue: /*i18n*/ { id: 'Increase value' },
  roundedUp: /*i18n*/ { id: 'Rounded up to the {bound} minimum.' },
  capped: /*i18n*/ { id: 'Capped at the {bound} maximum.' },
} as const;

/** The constraint a refusal states — of an amount (money) or of any other value — by its bounds. */
const REFUSED = {
  amount: {
    between: /*i18n*/ {
      id: "{figure} can't be recorded — the amount has to be between {min} and {max}.",
    },
    atLeast: /*i18n*/ { id: "{figure} can't be recorded — the amount has to be {min} or more." },
    atMost: /*i18n*/ { id: "{figure} can't be recorded — the amount can't be more than {max}." },
    outOfRange: /*i18n*/ { id: "{figure} can't be recorded — the amount is out of range." },
  },
  value: {
    between: /*i18n*/ {
      id: "{figure} can't be recorded — the value has to be between {min} and {max}.",
    },
    atLeast: /*i18n*/ { id: "{figure} can't be recorded — the value has to be {min} or more." },
    atMost: /*i18n*/ { id: "{figure} can't be recorded — the value can't be more than {max}." },
    outOfRange: /*i18n*/ { id: "{figure} can't be recorded — the value is out of range." },
  },
} as const;

export interface RefusalFacts {
  readonly figure: string;
  readonly money: boolean;
  readonly min?: string;
  readonly max?: string;
}

/** Every word `NumberField` says on its own, in the reader's language — its `words` prop. */
export function numberFieldWords(t: Translator['t']) {
  return {
    decrease: (name: string | undefined) =>
      name === undefined ? t(NUMBER_FIELD.decreaseValue) : t(NUMBER_FIELD.decrease, { name }),
    increase: (name: string | undefined) =>
      name === undefined ? t(NUMBER_FIELD.increaseValue) : t(NUMBER_FIELD.increase, { name }),
    roundedUp: (bound: string) => t(NUMBER_FIELD.roundedUp, { bound }),
    capped: (bound: string) => t(NUMBER_FIELD.capped, { bound }),
    refused: (facts: RefusalFacts) => {
      const of = REFUSED[facts.money ? 'amount' : 'value'];
      if (facts.min !== undefined && facts.max !== undefined) return t(of.between, { ...facts });
      if (facts.min !== undefined) return t(of.atLeast, { ...facts });
      if (facts.max !== undefined) return t(of.atMost, { ...facts });
      return t(of.outOfRange, { ...facts });
    },
  };
}
