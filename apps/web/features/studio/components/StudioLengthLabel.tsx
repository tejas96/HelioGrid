'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { Pressable, ShellGlyph } from '@heliogrid/ui';

/**
 * A length's label on the model (`T-M05-002`, part b): "~" and no outline from the picture, a
 * white outline when typed, a green one and a tick when measured on site. With a way to open it, a tap opens the length box.
 */
export function StudioLengthLabel({
  text,
  kind,
  pulse = false,
  live = false,
  label = null,
  onOpen = null,
}: {
  text: string;
  kind: string;
  pulse?: boolean;
  live?: boolean;
  label?: TranslatedText | null;
  onOpen?: (() => void) | null;
}) {
  const pill = (
    <span className="hg-roof-len" data-kind={kind} data-pulse={pulse} data-live={live}>
      <span className="hg-roof-len-num">{text}</span>
      {kind === 'measured' ? <ShellGlyph name="check" size="xs" tone="current" /> : null}
    </span>
  );
  if (onOpen === null || label === null) return pill;
  return (
    <Pressable className="hg-roof-hit" accessibilityLabel={label} ripple="none" onPress={onOpen}>
      {pill}
    </Pressable>
  );
}
