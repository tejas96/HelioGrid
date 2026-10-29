/**
 * `TimeField`'s and `TimeRangeField`'s own words (`packages/ui`'s `TimeFieldWords` and
 * `TimeRangeFieldWords`): the entry shape, the two refusals, the pair's ends, its order refusal and
 * its permitted hours — authored once for both platforms. Every time arrives in the market's
 * spelling, and each sentence is one whole message around it.
 */
import type { Translator } from '../runtime';
import { RANGE_FIELD } from './range-field';

const TIME_FIELD = {
  shape24: /*i18n*/ { id: 'HH:MM' },
  shape12: /*i18n*/ { id: 'h:mm AM' },
  notATime: /*i18n*/ { id: '"{typed}" isn\'t a time. Enter it as {shape}, like {example}.' },
  endBeforeStart: /*i18n*/ {
    id: 'The window has to end after it starts — {from} to {to} is not a window.',
  },
  permitted: /*i18n*/ { id: 'Calls are permitted {from}–{to} only.' },
  permittedNamed: /*i18n*/ { id: '{window}: calls are permitted {from}–{to} only.' },
} as const;

/** A time outside the window, by the window's name and by which of its bounds are set. */
const OUTSIDE = {
  named: {
    between: /*i18n*/ {
      id: '{time} is outside the {window} window — calls are allowed between {from} and {to}.',
    },
    noEarlier: /*i18n*/ {
      id: '{time} is outside the {window} window — calls are allowed no earlier than {from}.',
    },
    noLater: /*i18n*/ {
      id: '{time} is outside the {window} window — calls are allowed no later than {to}.',
    },
  },
  permitted: {
    between: /*i18n*/ {
      id: '{time} is outside the permitted window — calls are allowed between {from} and {to}.',
    },
    noEarlier: /*i18n*/ {
      id: '{time} is outside the permitted window — calls are allowed no earlier than {from}.',
    },
    noLater: /*i18n*/ {
      id: '{time} is outside the permitted window — calls are allowed no later than {to}.',
    },
  },
} as const;

interface OutsideFacts {
  readonly time: string;
  readonly from: string | null;
  readonly to: string | null;
  readonly window?: string;
}

interface SpanFacts {
  readonly from: string;
  readonly to: string;
  readonly window?: string;
}

/** Every word `TimeField` says on its own, in the reader's language — its `words` prop. */
export function timeFieldWords(t: Translator['t']) {
  return {
    shape24: t(TIME_FIELD.shape24),
    shape12: t(TIME_FIELD.shape12),
    outside: (facts: OutsideFacts) => {
      const of = OUTSIDE[facts.window === undefined ? 'permitted' : 'named'];
      if (facts.from !== null && facts.to !== null) return t(of.between, { ...facts });
      return facts.from !== null ? t(of.noEarlier, { ...facts }) : t(of.noLater, { ...facts });
    },
    notATime: (facts: {
      readonly typed: string;
      readonly shape: string;
      readonly example: string;
    }) => t(TIME_FIELD.notATime, { ...facts }),
  };
}

/** Every word `TimeRangeField` says on its own — its `words` prop, its two fields' words within. */
export function timeRangeFieldWords(t: Translator['t']) {
  return {
    ...timeFieldWords(t),
    from: t(RANGE_FIELD.from),
    to: t(RANGE_FIELD.to),
    endBeforeStart: (facts: SpanFacts) => t(TIME_FIELD.endBeforeStart, { ...facts }),
    permitted: (facts: SpanFacts) =>
      facts.window === undefined
        ? t(TIME_FIELD.permitted, { ...facts })
        : t(TIME_FIELD.permittedNamed, { ...facts }),
  };
}
