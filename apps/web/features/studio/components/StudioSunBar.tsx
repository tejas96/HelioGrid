'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { SunBarView, SunDayLine } from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  IconButton,
  Pressable,
  ShellGlyph,
  Slider,
  useFormat,
  useReducedMotion,
} from '@heliogrid/ui';
import type { Ref } from 'react';
import { useShareAt } from '../hooks/use-share-at';

type Moves = StudioScreen['moves'];
/** The day line marks every second hour, every third on a phone, where room is short. */
const TICK_HOURS_WIDE = 2;
const TICK_HOURS_PHONE = 3;

/** The day chips, and on a laptop the date beside them. */
function DayChips({
  view,
  words,
  phone,
  moves,
}: {
  view: SunBarView;
  words: StudioCanvasWords;
  phone: boolean;
  moves: Moves;
}) {
  const format = useFormat();
  const months = format.monthNames('short');
  const dateOf = (on: SunBarView['date']) => words.sunDate(on.day, months[on.month - 1] ?? '');
  return (
    <>
      <span className="hg-sun-chips" role="radiogroup" aria-label={words.sunDays}>
        {view.chips.map((chip) => (
          <Pressable
            key={chip.key}
            className="hg-sun-chip"
            accessibilityRole="radio"
            accessibilityState={{ checked: chip.key === view.day }}
            onPress={() => moves.pickSunDay(chip.key)}
          >
            {words.sunDay(chip.key, dateOf(chip.on))}
          </Pressable>
        ))}
      </span>
      {phone ? null : (
        <span className="hg-sun-date">
          <ShellGlyph name="calendar" size="sm" tone="current" />
          {dateOf(view.date)}
        </span>
      )}
    </>
  );
}

/** The day line: play, the handle as the sun, the whole hours, sunrise and sunset at its ends. */
function DayLine({
  line,
  phone,
  playing,
  words,
  moves,
}: {
  line: SunDayLine;
  phone: boolean;
  playing: boolean;
  words: StudioCanvasWords;
  moves: Moves;
}) {
  const t = useTranslate();
  const format = useFormat();
  const still = useReducedMotion();
  const now = useShareAt<HTMLSpanElement>(
    line.spanMinutes === 0 ? 0 : line.minutes / line.spanMinutes,
  );
  const every = phone ? TICK_HOURS_PHONE : TICK_HOURS_WIDE;
  return (
    <div className="hg-sun-track">
      <span className="hg-sun-play">
        <IconButton
          label={playing ? words.sunPause : words.sunPlay}
          variant="surface"
          onClick={() => (playing ? moves.pauseSun() : moves.playSun(still))}
        >
          <ShellGlyph name={playing ? 'pause' : 'play'} size="md" />
        </IconButton>
      </span>
      <div className="hg-sun-rail">
        <span ref={now} className="hg-sun-now" aria-hidden="true">
          {format.time(line.at.hhmm)}
        </span>
        <Slider
          value={line.minutes}
          min={0}
          max={line.spanMinutes}
          step={1}
          label={words.sunTimeOfDay}
          labelSpokenOnly
          steppers={false}
          format={() => format.time(line.at.hhmm)}
          ticks={line.ticks
            .filter((tick) => tick.at.hour % every === 0)
            .map((tick) => ({ value: tick.minutes }))}
          words={sliderWords(t)}
          onInput={moves.slideSun}
        />
        <span className="hg-sun-ends">
          <span>
            <i className="hg-sun-dot" data-at="rise" aria-hidden="true" />
            <span aria-hidden="true">{format.time(line.rise.hhmm)}</span>
            <span className="hg-spoken-only">{words.sunrise(format.time(line.rise.hhmm))}</span>
          </span>
          <span>
            <span aria-hidden="true">{format.time(line.set.hhmm)}</span>
            <span className="hg-spoken-only">{words.sunset(format.time(line.set.hhmm))}</span>
            <i className="hg-sun-dot" data-at="set" aria-hidden="true" />
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * The sun bar (`T-M05-002`, part g, board G8–G13): see-through glass at the foot over the real
 * sky — the day chips and the date, the chart and ×, then the day as one line from sunrise to
 * sunset with the sun as its handle and play beside it; where the sun stays down, one line. The
 * sky is the same in light and dark, so the bar is too.
 */
export function StudioSunBar({
  studio,
  words,
  phone,
  footRef,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  phone: boolean;
  /** The bar holds the foot: the camera frames above it. */
  footRef: Ref<HTMLElement> | null;
}) {
  const { view, playing, chart } = studio.sunBar;
  const { moves } = studio;
  if (view === null) return null;
  return (
    <section ref={footRef} className="hg-sun-bar" data-phone={phone} aria-label={words.sun}>
      <div className="hg-sun-top">
        <DayChips view={view} words={words} phone={phone} moves={moves} />
        <span className="hg-sun-tools">
          <IconButton
            label={words.sunChart}
            variant="ghost"
            pressed={chart}
            onClick={() => moves.showSunChart(!chart)}
          >
            <ShellGlyph name="bar-chart" size="sm" tone="current" />
          </IconButton>
          <IconButton label={words.sunClose} variant="ghost" onClick={moves.closeSun}>
            <ShellGlyph name="close" size="sm" tone="current" />
          </IconButton>
        </span>
      </div>
      {view.line === null ? (
        <p className="hg-sun-down">
          <ShellGlyph name="moon" size="md" tone="current" />
          {words.sunDown}
        </p>
      ) : (
        <DayLine line={view.line} phone={phone} playing={playing} words={words} moves={moves} />
      )}
    </section>
  );
}

/** Where the sun stands, at the top right under the compass: `127° SE · 25° up`. */
export function StudioSunBearing({
  studio,
  words,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const { view, playing } = studio.sunBar;
  if (view === null) return null;
  const { sun, bearing } = view;
  // Spoken when the sun settles, never on every frame of a play.
  return (
    <span className="hg-sun-bearing" role={playing ? undefined : 'status'}>
      <ShellGlyph name="sun" size="sm" tone="current" />
      {sun === null || bearing === null
        ? words.sunBelow
        : words.sunBearing(
            Math.round(sun.azimuthDegrees),
            bearing,
            Math.round(sun.elevationDegrees),
          )}
    </span>
  );
}
