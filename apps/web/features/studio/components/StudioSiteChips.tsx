'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import { Chip } from '@heliogrid/ui';

/**
 * A bar message's choices on the site's data (`T-M05-002`, part g): "Yes, it changed" and "No",
 * or the floors G, G+1, G+2, G+3+ — one row that scrolls sideways on a phone, one tap each.
 */
export function StudioSiteChips({
  name,
  chips,
}: {
  /** The row's name, for a screen reader. */
  name: TranslatedText;
  chips: readonly {
    readonly key: string;
    readonly label: TranslatedText;
    readonly onPress: () => void;
  }[];
}) {
  return (
    <fieldset className="hg-studio-kind-chips" aria-label={name}>
      {chips.map((chip) => (
        <Chip key={chip.key} density="pick" onClick={chip.onPress}>
          {chip.label}
        </Chip>
      ))}
    </fieldset>
  );
}
