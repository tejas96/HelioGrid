import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { CategoryHue } from '../Avatar/Avatar.types';

/** The six chip/badge tones — each resolves to a semantic `-text` token (and a `-bg` for Badge). */
export type ChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

/**
 * A Badge's tones: the six, and the three brand iris tones, which label a KIND (a role, a
 * category), never a state — a state is success / warning / danger / info (design-system change 7).
 */
export type BadgeTone = ChipTone | CategoryHue;

/**
 * Expressive = the brand's 28px pill; functional = the dense 24px working set; pick = a quick
 * choice a form offers a thumb (a size, a plan) — 36px, a strong hairline, ringed in ink when in
 * force; filter = a list's kind, stage or facet chip — 32px (`filter-chip-h`).
 */
export type ChipDensity = 'expressive' | 'functional' | 'pick' | 'filter';

export interface ChipProps {
  children?: ReactNode;
  /** filter chip active state — the accent wash, as every chosen filter is */
  active?: boolean;
  /**
   * How many records the chip's filter holds — drawn in a small mono slot after the words. A `0`
   * chip stays, quiet: hiding it would hide that the kind exists. Spoken with the words.
   */
  count?: number;
  /** With a handler the chip is a button inside a 44px target; without one it is a plain span. */
  onClick?: () => void;
  /** show a leading status dot */
  dot?: boolean;
  tone?: ChipTone;
  density?: ChipDensity;
  /** A mark before the words — *New plan*'s plus — drawn the same on both platforms. */
  glyph?: ShellGlyphName;
  /**
   * A node before the words the caller draws — a filter option's own glyph, a chosen facet's tick.
   * A chip with one takes two of its leading edge back.
   */
  leading?: ReactNode;
  /**
   * The group a pressable chip belongs to — *How it's charged*. The web names its group once, on
   * the fieldset around the chips, and draws nothing for it here; a phone cannot name a group, so
   * it says this after the chip's own name.
   */
  groupName?: TranslatedText;
}

export interface BadgeProps {
  children?: ReactNode;
  /** `violet` | `blue` | `magenta` are the brand iris tones for a KIND, never a state. */
  tone?: BadgeTone;
  density?: ChipDensity;
  /** The state's mark before the word, in the word's ink: status is glyph + word + tint. */
  glyph?: ShellGlyphName;
}
