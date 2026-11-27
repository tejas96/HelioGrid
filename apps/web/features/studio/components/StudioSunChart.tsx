'use client';
import { type StudioScreen, sunChartAxisOf } from '@heliogrid/data/react';
import type { SkylineAngles, SunChart, SunChartDay } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, ShellGlyph, useFormat } from '@heliogrid/ui';
import type { Ref } from 'react';
import { usePauseWhenHidden } from '../hooks/use-pause-hidden';
import { StudioSunBar } from './StudioSunBar';

/** The chart's frame, in its own units: the width and height, and the room for the axes. */
const WIDE = 520;
const HIGH = 220;
const LEFT = 30;
const RIGHT = 10;
const TOP = 10;
const FOOT = 24;
const TURN = 360;
const UP = 90;
/**
 * The chart's angle lines, every 15° up to the zenith; its compass all round from the point no
 * day's sun passes (`sunChartAxisOf`), so every day is one arc.
 */
const ANGLE_STEP = 15;
const ANGLES = Array.from({ length: UP / ANGLE_STEP - 1 }, (_, i) => (i + 1) * ANGLE_STEP);
/** The compass's four points round the chart, and the start again at its end. */
const POINTS_ROUND = 4;
const QUARTER = TURN / POINTS_ROUND;
/** A jump this wide between two points of a day's line is its wrap past the start: the line breaks. */
const WRAP_DEG = 15;
const LABEL_GAP = 6;
const LABEL_DROP = 4;
const HOUR_DOT = 2.6;

/** Across the chart: degrees round from its start, 0 to 360. */
const xRound = (round: number) => LEFT + (round / TURN) * (WIDE - LEFT - RIGHT);
const y = (elevation: number) => HIGH - FOOT - (Math.max(0, elevation) / UP) * (HIGH - TOP - FOOT);
const atRound = (round: number, elevation: number) =>
  `${xRound(round).toFixed(1)},${y(elevation).toFixed(1)}`;

/** Where an azimuth lies round the chart from its start, in degrees. */
type Round = (azimuth: number) => number;

/** The skyline's angles round the chart from its start, the start's angle again at its end. */
function skylineRound(skyline: SkylineAngles, round: Round) {
  const points = skyline.elevationsDeg
    .map((angle, i) => ({ round: round(i * skyline.stepDeg), angle }))
    .sort((a, b) => a.round - b.round);
  const first = points[0]?.angle ?? 0;
  return [...points, { round: TURN, angle: first }];
}

/** A skyline as the outline of what it hides, closed to the horizon. */
function skyPath(skyline: SkylineAngles, round: Round): string {
  const points = skylineRound(skyline, round).map((p) => `L${atRound(p.round, p.angle)}`);
  return `M${atRound(0, 0)} ${points.join(' ')} L${atRound(TURN, 0)} Z`;
}

const farPath = (skyline: SkylineAngles, round: Round) =>
  skylineRound(skyline, round)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${atRound(p.round, p.angle)}`)
    .join(' ');

/** A day's sun as one line, broken only where it would wrap past the chart's start. */
function dayPath(curve: SunChart['days'][number]['curve'], round: Round): string {
  return curve
    .map((point, i) => {
      const before = curve[i - 1];
      const here = round(point.azimuthDegrees);
      const jump = before === undefined || Math.abs(here - round(before.azimuthDegrees)) > WRAP_DEG;
      return `${jump ? 'M' : 'L'}${atRound(here, point.elevationDegrees)}`;
    })
    .join(' ');
}

/**
 * The sun chart (`T-M05-002`, part g, board G10): the skyline the roof sees from its middle, in
 * grey, the far hills dashed, three days' sun over it with their hours, today's sun as a ring, and
 * each day's shade in clock words below. It opens from the sun bar's chart button, in its place.
 */
export function StudioSunChart({
  studio,
  words,
  phone,
  footRef,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  phone: boolean;
  footRef: Ref<HTMLElement> | null;
}) {
  const format = useFormat();
  const months = format.monthNames('short');
  // Seen from the first roof, or from the roof whose sheet was last open.
  const roof = studio.roofSheet?.roof ?? 0;
  const topM = studio.scene.levels[roof]?.topM ?? 0;
  const chart = studio.site.sunChartOf(roof, topM);
  const name = studio.topMarks[roof]?.name;
  const sun = studio.sunBar.view?.sun ?? null;
  const shown = (day: SunChartDay) => `var(--scene-day-${day})`;
  const axis = sunChartAxisOf(chart);
  const x = (azimuth: number) => xRound(axis.round(azimuth));
  const ticks = axis.points.map((point, i) => ({ point, round: i * QUARTER }));
  return (
    <section
      ref={footRef}
      className="hg-studio-glass hg-roof-sheet hg-sun-chart"
      data-room={phone ? 'phone' : 'desktop'}
      aria-label={words.sunChartTitle}
    >
      <div className="hg-roof-sheet-head">
        <span className="hg-roof-sheet-names">
          <span className="hg-roof-sheet-title">{words.sunChartTitle}</span>
          {name === undefined ? null : (
            <span className="hg-roof-sheet-line">{words.sunChartFrom(words.sheetRoof(name))}</span>
          )}
        </span>
        <span className="hg-roof-sheet-close">
          <IconButton
            label={words.sunChartClose}
            variant="ghost"
            onClick={() => studio.moves.showSunChart(false)}
          >
            <ShellGlyph name="close" size="md" />
          </IconButton>
        </span>
      </div>
      {chart === null ? null : (
        <>
          <svg
            viewBox={`0 0 ${WIDE} ${HIGH}`}
            className="hg-sun-chart-svg"
            role="img"
            aria-label={words.sunChartPicture}
          >
            {ANGLES.map((angle) => (
              <g key={angle}>
                <line
                  x1={LEFT}
                  x2={WIDE - RIGHT}
                  y1={y(angle)}
                  y2={y(angle)}
                  className="hg-sun-chart-grid"
                />
                <text
                  x={LEFT - LABEL_GAP}
                  y={y(angle) + LABEL_DROP}
                  className="hg-sun-chart-axis"
                  textAnchor="end"
                >
                  {`${angle}°`}
                </text>
              </g>
            ))}
            {ticks.map(({ point, round }) => (
              <text
                key={round}
                x={xRound(round)}
                y={HIGH - LABEL_GAP}
                className="hg-sun-chart-axis"
                textAnchor="middle"
              >
                {words.sunPoint(point)}
              </text>
            ))}
            <path d={skyPath(chart.skyline, axis.round)} className="hg-sun-chart-sky" />
            {chart.far === null ? null : (
              <path d={farPath(chart.far, axis.round)} className="hg-sun-chart-far" />
            )}
            {chart.days.map((day) => (
              <g key={day.key} stroke={shown(day.key)} fill={shown(day.key)}>
                <path d={dayPath(day.curve, axis.round)} fill="none" className="hg-sun-chart-day" />
                {day.curve
                  .filter((point) => point.onHour)
                  .map((point) => (
                    <circle
                      key={point.azimuthDegrees}
                      cx={x(point.azimuthDegrees)}
                      cy={y(point.elevationDegrees)}
                      r={HOUR_DOT}
                      stroke="none"
                    />
                  ))}
              </g>
            ))}
            {sun === null ? null : (
              <circle
                cx={x(sun.azimuthDegrees)}
                cy={y(sun.elevationDegrees)}
                className="hg-sun-chart-now"
              />
            )}
          </svg>
          <ul className="hg-sun-chart-days">
            {chart.days.map((day) => (
              <li key={day.key}>
                <i className="hg-sun-chart-key" data-day={day.key} aria-hidden="true" />
                <b>{words.sunDate(day.on.day, months[day.on.month - 1] ?? '')}</b>
                <span>
                  {words.sunShade(
                    day.shade.map((s) => `${format.time(s.from.hhmm)}–${format.time(s.to.hhmm)}`),
                  )}
                </span>
              </li>
            ))}
          </ul>
          {chart.far === null ? null : (
            <p className="hg-sun-chart-credit">{words.sunPvgisCredit}</p>
          )}
        </>
      )}
    </section>
  );
}

/** The sun at the foot: its bar, or the chart in the bar's place. */
export function StudioSunFoot(props: Parameters<typeof StudioSunChart>[0]) {
  usePauseWhenHidden(props.studio.sunBar.playing, props.studio.moves.pauseSun);
  return props.studio.sunBar.chart ? <StudioSunChart {...props} /> : <StudioSunBar {...props} />;
}
