/**
 * `Banner`'s own words (`packages/ui`'s `Banner` and `BannerStack`): the cross's spoken name, and
 * the line under a stack that capped some banners away — in three languages (`F3-07`).
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';
import { CATALOG_SETTINGS } from './catalog-settings';

export const BANNER = {
  dismiss: CATALOG_SETTINGS.dismiss,
  more: /*i18n*/ {
    id: '{count, plural, one {# more notice on this screen} other {# more notices on this screen}}',
  },
} as const;

/** Every word a banner or its stack says of its own, in the reader's language. */
export function bannerWords(t: Translator['t']) {
  return {
    dismissLabel: t(BANNER.dismiss),
    moreLabel: (hidden: number): TranslatedText => t(BANNER.more, { count: hidden }),
  };
}
