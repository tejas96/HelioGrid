/**
 * `Timeline`'s usual state words (`packages/ui`'s `Timeline`): the name its loading face speaks
 * and the sentences its empty, failed and unavailable faces show. A timeline draws each only when
 * given, so a caller passes, prop by prop, the ones its read can reach.
 */
import { SHELL } from './shell';

export const TIMELINE = {
  loading: /*i18n*/ { id: 'Loading activity' },
  empty: /*i18n*/ { id: 'No activity yet' },
  emptyDescription: /*i18n*/ { id: 'Steps appear here as the job moves.' },
  couldNotLoad: /*i18n*/ { id: "Couldn't load the activity" },
  keepsFailing: SHELL.keepsFailing,
  noSequence: /*i18n*/ { id: 'No sequence here' },
} as const;
