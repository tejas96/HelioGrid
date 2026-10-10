import type { BlockAnnouncement, BlockTone } from '@heliogrid/domain';

/**
 * The tinted block above a locked code field or under a finding: the words carry the reason, the
 * tint is the second channel — never colour alone (`F7-12`).
 */
export interface TintedBlockProps {
  tone: BlockTone;
  title: string;
  /** What to do next, when the controls under the block do not already say it; omitted, the title stands alone. */
  body?: string;
  /**
   * How the block is spoken when it appears. `alert` — it answers a press, so it says itself at
   * once, title then body: a region that mounts already holding its words is not reliably spoken.
   * Web: `role="alert"`; phone: an announcement on arrival. `status` — a fact the page opens on,
   * read in its place. Web: `role="status"`; Android: a polite live region; iOS: read in place.
   * `Text`'s `live` is not reused: on the phone it is a live region, which iOS never speaks.
   */
  announce?: BlockAnnouncement;
}
