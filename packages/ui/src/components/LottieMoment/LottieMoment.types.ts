import type { TranslatedText } from '@heliogrid/contracts';

/**
 * The moments that matter, each one small original animation in the logo's colours:
 * `success` an action confirmed (a price saved, a payment recorded), `celebrate` a milestone (a
 * company created, the catalog published, you're ready), `empty` a calm list with nothing in it yet.
 */
export type LottieMomentName = 'success' | 'celebrate' | 'empty';

/** The side, px on the web and dp on the phone: a toast 48, an inline mark 72, a hero 96 or 120. */
export type LottieMomentSize = 48 | 72 | 96 | 120;

/**
 * **One Lottie moment** (`CLAUDE.md` §10, *Motion*): loads lazily on the web, plays ONCE when it
 * first comes into view, then holds its last frame; under reduced motion it shows the last frame at
 * once. Decorative unless `label` names it — the words beside it say what happened.
 */
export interface LottieMomentProps {
  readonly name: LottieMomentName;
  readonly size: LottieMomentSize;
  readonly label?: TranslatedText;
}
