import type { FrameTone } from '@heliogrid/domain';
import { Text } from '@heliogrid/ui';

/** The tinted block above a locked code field: the words carry the reason, the tint is the second channel. */
export function TintedBlock({
  tone,
  title,
  body,
}: {
  tone: FrameTone;
  title: string;
  body: string;
}) {
  return (
    <div className="hg-door-tinted" data-tone={tone}>
      <Text variant="body-sm" color={tone}>
        {title}
      </Text>
      <Text variant="caption" color="secondary">
        {body}
      </Text>
    </div>
  );
}
