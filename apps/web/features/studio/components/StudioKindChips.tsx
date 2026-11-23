'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { MeetChoice } from '@heliogrid/domain';
import { Chip, ShellGlyph, type ShellGlyphName } from '@heliogrid/ui';

/** The small picture of each chip: what the roof would be, or what the move does. */
const CHOICE_GLYPH: Record<MeetChoice, ShellGlyphName> = {
  building: 'house',
  stair_room: 'steps',
  upper_floor: 'storeys',
  open_shed: 'canopy',
  hole: 'opening',
  dormer: 'house',
  separate_part: 'columns',
  join: 'link',
  cut_to_edge: 'trim',
};

/**
 * The chips on the line after a new roof closes (`T-M05-002`, part e): its likely kinds in one row
 * that scrolls sideways on a phone, the one it is now first and marked with a check, so a wrong
 * guess is one tap.
 */
export function StudioKindChips({
  name,
  chips,
  onChoose,
}: {
  /** The row's name, for a screen reader. */
  name: TranslatedText;
  chips: readonly {
    readonly choice: MeetChoice;
    readonly lit: boolean;
    readonly label: TranslatedText;
  }[];
  onChoose: (choice: MeetChoice) => void;
}) {
  return (
    <fieldset className="hg-studio-kind-chips" aria-label={name}>
      {chips.map((chip) => (
        <Chip
          key={chip.choice}
          density="pick"
          active={chip.lit}
          glyph={CHOICE_GLYPH[chip.choice]}
          onClick={() => onChoose(chip.choice)}
        >
          {chip.label}
          {chip.lit ? <ShellGlyph name="check" size="sm" /> : null}
        </Chip>
      ))}
    </fieldset>
  );
}
