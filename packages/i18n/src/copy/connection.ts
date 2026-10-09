/**
 * The words of the one full-screen state for an app that can reach nothing (`NoConnection`): a
 * boot check with no answer and a device gone offline say the same thing, because neither knows
 * whose side failed (`F8-36`). No board draws this screen; the Hindi and Marathi owe a native review.
 */
import type { Translator } from '../runtime';
import { SIGN_IN } from './sign-in';

export const CONNECTION = {
  title: /*i18n*/ { id: 'HelioGrid could not be reached' },
  message: /*i18n*/ { id: 'It may be your connection or ours. Try again in a moment.' },
  stillNoAnswer: /*i18n*/ { id: 'Still no answer from HelioGrid.' },
  tooLong: /*i18n*/ { id: 'That is taking too long to answer.' },
} as const;

/** Every word `NoConnection` draws, so its English defaults never reach a reader. */
export function connectionWords(translate: Translator['t']) {
  return {
    title: translate(CONNECTION.title),
    message: translate(CONNECTION.message),
    retryLabel: translate(SIGN_IN.tryAgain),
    failedMessage: translate(CONNECTION.stillNoAnswer),
    timeoutMessage: translate(CONNECTION.tooLong),
  };
}
