'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import {
  LINE_UP_LIFT_MAX_M,
  LINE_UP_STEP_M,
  type MeasurementSystem,
  SEE_THROUGH_MAX,
  SEE_THROUGH_MIN,
  SEE_THROUGH_STEP,
  SUNLIGHT_KEY_FROM,
  SUNLIGHT_KEY_TO,
} from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  IconButton,
  SegmentedControl,
  ShellGlyph,
  Slider,
  Switch,
  useFormat,
} from '@heliogrid/ui';
import { StudioHeightKey } from './StudioHeightKey';

const PER_CENT = 100;

type Site = StudioScreen['site'];

/**
 * The key for what the height view shows: in the View panel, and on the map while the view is on
 * (board G7, G25) — heights in the reader's units, or sunlight's 60 % to 100 %.
 */
export function StudioSiteKey({
  site,
  words,
  units,
  inPanel,
}: {
  site: Site;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  inPanel: boolean;
}) {
  const format = useFormat();
  const { view, surface } = site;
  const sun = view.mode === 'sunlight';
  // On the map while the view shows something: the heights' surface, or sunlight on the roofs.
  if (!inPanel && (!view.on || (sun ? site.sunlight === null : surface === null))) return null;
  const heightOf = (metres: number) => format.roofHeight(metres, units);
  // Sunlight's key runs from much shade to none (board G24), as the domain sets its ends.
  const shareOf = (share: number) => words.sitePercent(format.number(share * PER_CENT));
  return (
    <StudioHeightKey
      name={words.siteKeyName}
      sun={sun}
      low={sun ? shareOf(SUNLIGHT_KEY_FROM) : heightOf(surface?.key.lowM ?? 0)}
      high={sun ? shareOf(SUNLIGHT_KEY_TO) : heightOf(surface?.key.highM ?? 0)}
      inPanel={inPanel}
    />
  );
}

/** Line up the map (board G23): its height on one slider, four arrows, Back to automatic. */
function LineUp({
  site,
  words,
  units,
  turnOf,
}: {
  site: Site;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  turnOf: () => number;
}) {
  const t = useTranslate();
  const format = useFormat();
  if (!site.view.lining) {
    return (
      <Button variant="ghost" onClick={() => site.setView({ lining: true })}>
        {words.siteLineUp}
      </Button>
    );
  }
  // An arrow's way on the screen, turned onto the ground by the view's turn.
  const nudge = (screenEast: number, screenNorth: number) => {
    const turn = turnOf();
    site.nudgeMap({
      east: screenEast * Math.cos(turn) - screenNorth * Math.sin(turn),
      north: screenEast * Math.sin(turn) + screenNorth * Math.cos(turn),
    });
  };
  return (
    <div className="hg-studio-lineup">
      <Slider
        value={site.surface?.lineUp.lift ?? 0}
        min={-LINE_UP_LIFT_MAX_M}
        max={LINE_UP_LIFT_MAX_M}
        step={LINE_UP_STEP_M}
        label={words.siteLineUpLift}
        format={(metres) => format.fineLength(metres, units)}
        words={sliderWords(t)}
        onCommit={site.liftMap}
      />
      <div className="hg-studio-lineup-arrows">
        <IconButton label={words.siteMapLeft} variant="ghost" onClick={() => nudge(-1, 0)}>
          <ShellGlyph name="chevron-left" size="sm" />
        </IconButton>
        <IconButton label={words.siteMapUp} variant="ghost" onClick={() => nudge(0, 1)}>
          <ShellGlyph name="chevron-up" size="sm" />
        </IconButton>
        <IconButton label={words.siteMapDown} variant="ghost" onClick={() => nudge(0, -1)}>
          <ShellGlyph name="chevron" size="sm" />
        </IconButton>
        <IconButton label={words.siteMapRight} variant="ghost" onClick={() => nudge(1, 0)}>
          <ShellGlyph name="chevron-right" size="sm" />
        </IconButton>
      </div>
      <Button variant="ghost" onClick={site.mapBack}>
        {words.siteMapBack}
      </Button>
    </div>
  );
}

/**
 * The View panel's first group (`T-M05-002`, part g, board G6, G23, G24, G25n): the height view's
 * switch; while it is on, Heights or Sunlight, how see-through, the key, and Line up the map.
 * Where the site has no height map, the switch stays off and says why.
 */
export function StudioHeightGroup({
  site,
  words,
  units,
  editable,
  turnOf,
}: {
  site: Site;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  editable: boolean;
  /** The view's turn from north up, in radians: an arrow's way on the ground. */
  turnOf: () => number;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { view } = site;
  const data = site.read.kind === 'ready' ? site.read.value : null;
  if (data === null) return null;
  const has = data.source === 'google_solar';
  const sun = view.mode === 'sunlight';
  return (
    <div className="hg-studio-view-group hg-studio-height-group">
      <Switch
        checked={has && view.on}
        disabled={!has}
        label={words.siteHeightView}
        {...(has ? {} : { description: words.siteHeightViewNone })}
        onChange={(on) => site.setView({ on })}
      />
      {has && view.on ? (
        <>
          <SegmentedControl
            ariaLabel={words.siteShow}
            fill
            value={view.mode}
            options={[
              { value: 'heights', label: words.siteHeights },
              { value: 'sunlight', label: words.siteSunlight },
            ]}
            onChange={(mode) =>
              site.setView({ mode: mode === 'sunlight' ? 'sunlight' : 'heights' })
            }
          />
          <Slider
            value={Math.round(view.seeThrough * PER_CENT)}
            min={SEE_THROUGH_MIN * PER_CENT}
            max={SEE_THROUGH_MAX * PER_CENT}
            step={SEE_THROUGH_STEP * PER_CENT}
            label={words.siteSeeThrough}
            format={(value) => words.sitePercent(format.number(value))}
            words={sliderWords(t)}
            onInput={(value) => site.setView({ seeThrough: value / PER_CENT })}
          />
          <StudioSiteKey site={site} words={words} units={units} inPanel />
          {!sun && editable ? (
            <LineUp site={site} words={words} units={units} turnOf={turnOf} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
