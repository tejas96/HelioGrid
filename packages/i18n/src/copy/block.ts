/**
 * `Block`'s usual state words (`packages/ui`'s `Block`): the name its loading body speaks — with
 * the block's own title when it has one (`loadingNamed`) — and the sentences its empty, failed and
 * unavailable bodies show. A block draws each only when given, so a caller passes, prop by prop,
 * the ones its read can reach.
 */
import { CARD } from './card';

export const BLOCK = {
  loading: CARD.loading,
  loadingNamed: /*i18n*/ { id: 'Loading {title}' },
  empty: CARD.empty,
  couldNotLoad: CARD.couldNotLoad,
  keepsFailing: CARD.keepsFailing,
  notAvailable: /*i18n*/ { id: 'Not available' },
} as const;
