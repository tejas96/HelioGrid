import type { FrameTone } from '@heliogrid/domain';
import { Text } from '@heliogrid/ui';

/** The block's tint: the door's two refusal tones, and `info` for a finding that is a steer, not a refusal (`SCR-M01-02`). */
export type BlockTone = FrameTone | 'info';

/** The tinted block above a locked code field or under a finding: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
  className,
}: {
  tone: BlockTone;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={className === undefined ? 'hg-door-tinted' : `hg-door-tinted ${className}`}
      data-tone={tone}
    >
      <Text variant="body-sm" color={tone}>
        {title}
      </Text>
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    </div>
  );
}
