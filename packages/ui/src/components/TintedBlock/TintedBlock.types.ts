import type { TranslatedText } from '@heliogrid/contracts';
import type { BlockAnnouncement, BlockTone } from '@heliogrid/domain';
import type { ExplainerProps } from '../Explainer/Explainer.types';

/**
 * The tinted block above a locked code field or under a finding: the words carry the reason, the
 * tint is the second channel — never colour alone (`F7-12`).
 */
export interface TintedBlockProps {
  tone: BlockTone;
  title: TranslatedText;
  /** What to do next, when the controls under the block do not already say it; omitted, the title stands alone. */
  body?: TranslatedText;
  /**
   * How the block is spoken when it appears. `alert` — it answers a press, so it says itself at
   * once, title then body: a region that mounts already holding its words is not reliably spoken.
   * Web: `role="alert"`; phone: an announcement on arrival. `status` — a fact the page opens on,
   * read in its place. Web: `role="status"`; Android: a polite live region; iOS: read in place.
   * `Text`'s `live` is not reused: on the phone it is a live region, which iOS never speaks.
   */
  announce?: BlockAnnouncement;
  /**
   * The title is the page's heading: a failure that takes the heading's place holds what went
   * wrong and what fixes it as one message (`SCR-M01-04`, `m-error`). Drawn in the `h3` role in the
   * tone's ink; on the web it is the document's `h1`, so the screen that sets it draws no other.
   */
  heading?: boolean;
  /** The one ask about the block, at the far end of the title's row, inset so the row keeps the title's height. */
  explainer?: ExplainerProps;
}
