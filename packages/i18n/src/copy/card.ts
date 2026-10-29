/**
 * `Card`'s usual state words (`packages/ui`'s `Card`): the name a card's loading body speaks and
 * the sentences its empty, failed and unavailable bodies show. A card draws each only when given,
 * so a caller passes, prop by prop, the ones its read can reach.
 */
import { NOTIFICATION_CENTRE } from './notifications';
import { SHELL } from './shell';

export const CARD = {
  loading: /*i18n*/ { id: 'Loading' },
  empty: /*i18n*/ { id: 'Nothing here yet.' },
  couldNotLoad: /*i18n*/ { id: "Couldn't load this" },
  keepsFailing: SHELL.keepsFailing,
  notAvailableHere: NOTIFICATION_CENTRE.landingTitle,
} as const;
