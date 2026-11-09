import type { TranslatedText } from '@heliogrid/contracts';
import { DEFAULT_BRAND_COLOUR } from './brand-swatches';

/**
 * The hex field's leading dot. A tap opens the system colour picker, so a custom colour needs no
 * typed hex. The picker reports each move, so the live preview follows the drag.
 */
export function BrandColorPick({
  hex,
  label,
  disabled,
  onPick,
}: {
  /** The valid colour shown, or null while the draft is not one. */
  hex: string | null;
  label: TranslatedText;
  disabled: boolean;
  onPick: (hex: string) => void;
}) {
  return (
    <span className="hg-brand-color-pick" data-disabled={disabled ? 'true' : undefined}>
      <span
        aria-hidden="true"
        className="hg-brand-color-chip"
        /* The tenant's colour is DATA — inline is the only honest place for it. */
        style={hex === null ? undefined : { background: hex }}
      />
      <input
        type="color"
        className="hg-brand-color-picker"
        aria-label={label}
        value={hex ?? DEFAULT_BRAND_COLOUR}
        disabled={disabled}
        onChange={(event) => onPick(event.target.value)}
      />
    </span>
  );
}
