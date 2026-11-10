import type { TranslatedText } from '@heliogrid/contracts';

/**
 * The moments that matter, each one small original animation in the logo's colours, played once:
 * - `success` an action confirmed (a payment recorded, a step done) · `saved` the quicker confirm of
 *   one saved value (a price, a field)
 * - `celebrate` a milestone (you're ready, setup complete) · `sunrise` the door's welcome and a
 *   company just created · `published` a catalog release going out · `sent` an invite or a link
 *   sent · `plan` a plan that starts
 *
 * A place with nothing in it is never a moment: it is the grey line drawing of `EmptyScene`.
 */
export type LottieMomentName =
  | 'success'
  | 'saved'
  | 'celebrate'
  | 'sunrise'
  | 'published'
  | 'sent'
  | 'plan';

/** The side, px on the web and dp on the phone: a toast 48, an inline mark 72, a hero 96 or 120. */
export type LottieMomentSize = 48 | 72 | 96 | 120;

/**
 * **One Lottie moment** (`CLAUDE.md` §10, *Motion*): loads lazily on the web, plays ONCE when it
 * first comes into view, then holds its last frame; under reduced motion it shows the last frame at
 * once. Nothing here loops: a wait is a line (`IndeterminateRail`), never an animation.
 */
export interface LottieMomentProps {
  readonly name: LottieMomentName;
  readonly size: LottieMomentSize;
  /** Decorative unless this names it — the words beside it say what happened. */
  readonly label?: TranslatedText;
}
