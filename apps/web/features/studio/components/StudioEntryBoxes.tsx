'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { LengthEntry, MeasurementSystem } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Input } from '@heliogrid/ui';

/**
 * The boxes a length or a height is typed in (`T-M05-002`, *Values*): metres, or feet and inches,
 * as the board draws them. One part for the length field and the roof's sheet. A box keeps what is
 * typed, so a number the reader refuses ("10.001e3400") reaches it and is refused with its reason.
 */
export function StudioEntryBoxes({
  entry,
  units,
  label,
  focusRequest,
  onEntry,
  words,
}: {
  entry: LengthEntry;
  units: MeasurementSystem;
  /** The box's spoken name in metres; in feet it is "Feet". */
  label: TranslatedText;
  /** Each new number lands focus in the first box. */
  focusRequest: number;
  onEntry: (entry: LengthEntry) => void;
  words: StudioCanvasWords;
}) {
  const feet = units === 'imperial';
  return (
    <div className="hg-length-box-row">
      <span className="hg-length-box-well">
        <Input
          label={feet ? words.lengthFeet : label}
          labelSpokenOnly
          type="decimal"
          mono
          density="functional"
          value={entry.main}
          focusRequest={focusRequest}
          onChange={(main) => onEntry({ ...entry, main })}
          trailing={feet ? words.unitFeet : words.unitMetres}
        />
      </span>
      {feet ? (
        <span className="hg-length-box-well" data-short="true">
          <Input
            label={words.lengthInches}
            labelSpokenOnly
            type="decimal"
            mono
            density="functional"
            value={entry.inches}
            onChange={(inches) => onEntry({ ...entry, inches })}
            trailing={words.unitInches}
          />
        </span>
      ) : null}
    </div>
  );
}
