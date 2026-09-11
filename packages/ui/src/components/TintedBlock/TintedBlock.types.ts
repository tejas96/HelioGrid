import type { FrameTone } from '@heliogrid/domain';

/** The block's tint: the door's two refusal tones, and `info` for a finding that is a steer, not a refusal (`SCR-M01-02`). */
export type BlockTone = FrameTone | 'info';

/**
 * The tinted block above a locked code field or under a finding: the words carry the reason, the
 * tint is the second channel — never colour alone (`F7-12`).
 */
export interface TintedBlockProps {
  tone: BlockTone;
  title: string;
  body: string;
}
