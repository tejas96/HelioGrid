'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofStepState } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import {
  Button,
  IconButton,
  Input,
  SegmentedControl,
  ShellGlyph,
  Switch,
  useFormat,
} from '@heliogrid/ui';

type Sizing = Extract<RoofStepState, { kind: 'sizing' }>;

/** Each edge opened gives the box a new focus number: roof × this + edge. */
const FOCUS_PER_ROOF = 1_000;

/**
 * The length box (`T-M05-002`, part b): opened by a tap on a length, in the top view or in 3D. It
 * sits in the head, clear of a phone's keyboard; the box, the label on the roof and the line show
 * one value, live. Set or Enter keeps it as one change; × or Esc puts the old length back. A value
 * far off the picture asks once, here, before it is used.
 */
export function StudioLengthBox({
  sizing,
  studio,
  units,
  words,
}: {
  sizing: Sizing;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const { moves } = studio;
  const { entry } = sizing;
  const feet = units === 'imperial';
  const { traced, typed, first } = studio.lengthBox ?? { traced: 0, typed: null, first: false };
  const switchUnits = (next: string) =>
    moves.lengthUnits(next === 'imperial' ? 'imperial' : 'metric');
  return (
    <form
      className="hg-studio-glass hg-length-box"
      aria-label={words.lengthLabel}
      onSubmit={(event) => event.preventDefault()}
      // Enter keeps the length, from either box; Esc is the canvas's, as for every act in hand.
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        moves.setLength();
      }}
    >
      <span className="hg-length-box-label">{words.lengthLabel}</span>
      <div className="hg-length-box-row">
        <span className="hg-length-box-well">
          <Input
            label={feet ? words.lengthFeet : words.lengthLabel}
            labelSpokenOnly
            type="number"
            mono
            density="functional"
            value={entry.main}
            focusRequest={sizing.roof * FOCUS_PER_ROOF + sizing.edge + 1}
            onChange={(main) => moves.typeLength({ ...entry, main })}
            trailing={feet ? words.unitFeet : words.unitMetres}
          />
        </span>
        {feet ? (
          <span className="hg-length-box-well" data-short="true">
            <Input
              label={words.lengthInches}
              labelSpokenOnly
              type="number"
              mono
              density="functional"
              value={entry.inches}
              onChange={(inches) => moves.typeLength({ ...entry, inches })}
              trailing={words.unitInches}
            />
          </span>
        ) : null}
        <span className="hg-length-box-unit">
          <SegmentedControl
            ariaLabel={words.lengthUnit}
            value={units}
            onChange={switchUnits}
            options={[
              { value: 'metric', label: words.unitMetres },
              { value: 'imperial', label: words.unitFeet },
            ]}
          />
        </span>
        <span className="hg-length-box-switch" data-asking={sizing.asking}>
          <Switch
            label={words.measuredOnSite}
            checked={entry.measured}
            toggleAt="start"
            onChange={(measured) => moves.typeLength({ ...entry, measured })}
          />
        </span>
        <span className="hg-length-box-go">
          <Button
            variant="primary"
            size="md"
            onClick={moves.setLength}
            disabled={studio.bar?.kind === 'roofs' && studio.bar.live !== null}
            icon={<ShellGlyph name="check" size="sm" />}
          >
            {words.setLength}
          </Button>
          <IconButton label={words.closeLength} variant="ghost" onClick={moves.cancel}>
            <ShellGlyph name="close" size="md" />
          </IconButton>
        </span>
      </div>
      {sizing.asking && typed !== null ? (
        <div className="hg-length-box-ask" role="alert">
          <span className="hg-length-box-ask-words">
            <ShellGlyph name="alert-circle" size="sm" />
            <span>
              {words.lengthAsk(
                // "About" is the sentence's own word: the length drops its "~".
                format.roofLength(traced, units, true).replace(/^~/, ''),
                format.roofLength(typed, units, false),
              )}
            </span>
          </span>
          <span className="hg-length-box-ask-acts">
            <Button variant="secondary" size="sm" onClick={() => moves.confirmLength(false)}>
              {words.lengthChange}
            </Button>
            <Button variant="primary" size="sm" onClick={() => moves.confirmLength(true)}>
              {words.lengthUse(format.roofLength(typed, units, false))}
            </Button>
          </span>
        </div>
      ) : (
        <span className="hg-length-box-hint">{words.lengthHint(first)}</span>
      )}
    </form>
  );
}
