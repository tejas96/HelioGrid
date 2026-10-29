/**
 * `PendingAction`'s usual acts (`packages/ui`'s `PendingAction`): the retry and the clearing
 * button on a returned line. The line itself — the act named, the reason it came back — is the
 * caller's.
 */
import type { Translator } from '../runtime';
import { CATALOG_SETTINGS } from './catalog-settings';
import { SIGN_IN } from './sign-in';

/** A returned line's two acts, named as `PendingAction` takes them. */
export function pendingActionWords(t: Translator['t']) {
  return {
    retryLabel: t(SIGN_IN.tryAgain),
    dismissLabel: t(CATALOG_SETTINGS.dismiss),
  };
}
