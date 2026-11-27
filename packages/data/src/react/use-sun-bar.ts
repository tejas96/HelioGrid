'use client';
import type { SiteDataWire } from '@heliogrid/contracts';
import {
  type Coordinate,
  chartAzimuth,
  type Read,
  type StudioView,
  SUN_STEP_MS,
  type SunBarView,
  type SunChart,
  type SunDay,
  type SunPick,
  type SunPosition,
  sceneSunAt,
  siteTimeZoneOf,
  sunBarAt,
  sunBarDayOf,
  sunChartPoints,
  sunChartStartOf,
  sunNextHour,
  sunPickDay,
  sunPickOpened,
  sunPickSlid,
  sunPlayedTo,
} from '@heliogrid/domain';
import { useEffect, useMemo, useRef, useState } from 'react';

/** The sun bar's moves (`T-M05-002`, part g, board G8–G13). */
export interface SunBarMoves {
  /** The sun opens on today, now; from the top view the camera flies to 3D first. */
  openSun(): void;
  /** × : the bar closes and the scene goes back to now; the view stays 3D. */
  closeSun(): void;
  pickSunDay(day: SunDay): void;
  /** The handle moved to `minutes` after sunrise. */
  slideSun(minutes: number): void;
  /** Play the day to sunset in 6 s, or under Reduce Motion (`still`) hour by hour. */
  playSun(still: boolean): void;
  pauseSun(): void;
  /** The sun path and shade times (board G10), over the bar. */
  showSunChart(open: boolean): void;
}

export interface SunBarState {
  /** The bar as it shows; `null` while it is closed. */
  readonly view: SunBarView | null;
  readonly playing: boolean;
  /** The sun chart is open over the bar. */
  readonly chart: boolean;
}

/** The sun's light never comes from under this, so a roof at sunrise still reads. */
const LIGHT_MIN_ELEVATION_DEG = 2;

/**
 * The sun bar's pick, its play and the sun the scene is lit by: the picked moment's sun while the
 * bar is open, else the real sun for the site now (its noon after dark), read once for the opening.
 * The site's clock is its time zone, from the site data; until that comes, the hour zone its
 * longitude lies in.
 */
export function useSunBar({
  pin,
  read,
  see,
  zone,
}: {
  pin: Coordinate | null;
  read: Read<SiteDataWire>;
  /** Takes the view: the sun lives in 3D. */
  see: (view: StudioView) => void;
  /** The company's time zone: the site's clock until the site data names the site's own. */
  zone: string;
}): {
  view: { sun: SunPosition | null; sunBar: SunBarState };
  moves: SunBarMoves;
} {
  const [pick, setPick] = useState<SunPick | null>(null);
  const [playing, setPlaying] = useState<{ still: boolean } | null>(null);
  const [chart, setChart] = useState(false);
  const now = useRef(Date.now());
  // The site's own zone once the data names it — at sea, the hour zone of its longitude.
  const data = read.kind === 'ready' ? read.value : null;
  const timeZone =
    pin === null ? null : data === null ? zone : siteTimeZoneOf(data.timeZone, pin.longitude);
  const opening = useMemo(() => (pin === null ? null : sceneSunAt(pin, now.current)), [pin]);
  // The day is worked once for the day, the place and the clock; a play moves only the moment.
  const day = pick?.day ?? null;
  const today = useMemo(
    () =>
      day === null || pin === null || timeZone === null
        ? null
        : sunBarDayOf(day, pin, timeZone, now.current),
    [day, pin, timeZone],
  );
  const atMs = pick?.atMs ?? null;
  const view = useMemo(
    () =>
      today === null || atMs === null || pin === null || timeZone === null
        ? null
        : sunBarAt(today, atMs, pin, timeZone),
    [today, atMs, pin, timeZone],
  );
  useSunPlay(view, timeZone, playing, setPick, () => setPlaying(null));
  const sun = view === null ? opening : lightOf(view, opening);
  const ready = (then: (place: Coordinate, clock: string) => void) => {
    if (pin !== null && timeZone !== null) then(pin, timeZone);
  };
  return {
    view: { sun, sunBar: { view, playing: playing !== null, chart: chart && view !== null } },
    moves: {
      openSun: () =>
        ready((place, clock) => {
          see('3d');
          now.current = Date.now();
          setPick(sunPickOpened(place, clock, now.current));
        }),
      closeSun: () => {
        setPlaying(null);
        setChart(false);
        setPick(null);
      },
      pickSunDay: (day) =>
        ready((place, clock) => {
          setPlaying(null);
          setPick((at) => (at === null ? at : sunPickDay(at, day, place, clock, now.current)));
        }),
      slideSun: (minutes) => {
        const line = view?.line;
        if (line == null) return;
        setPlaying(null);
        setPick((at) => (at === null ? at : sunPickSlid(at, line, minutes)));
      },
      playSun: (still) => {
        const line = view?.line;
        if (line == null) return;
        // From sunset, play starts the day again.
        if (view?.line?.minutes === line.spanMinutes) {
          setPick((at) => (at === null ? at : { ...at, atMs: line.fromMs }));
        }
        setPlaying({ still });
      },
      pauseSun: () => setPlaying(null),
      showSunChart: setChart,
    },
  };
}

/** The picked sun, lifted just over the horizon to light by; the opening's while it is down. */
function lightOf(view: SunBarView, opening: SunPosition | null): SunPosition | null {
  if (view.sun === null) return opening;
  const { azimuthDegrees, elevationDegrees } = view.sun;
  return { azimuthDegrees, elevationDegrees: Math.max(LIGHT_MIN_ELEVATION_DEG, elevationDegrees) };
}

/** Plays the day: each frame moves the sun on, or under Reduce Motion each second an hour. */
function useSunPlay(
  view: SunBarView | null,
  timeZone: string | null,
  playing: { still: boolean } | null,
  setPick: (next: (at: SunPick | null) => SunPick | null) => void,
  stop: () => void,
) {
  const line = view?.line ?? null;
  const live = useRef({ line, timeZone, stop });
  live.current = { line, timeZone, stop };
  const on = playing !== null && line !== null;
  const still = playing?.still ?? false;
  useEffect(() => {
    if (!on) return;
    const step = (to: (at: SunPick) => number) =>
      setPick((at) => {
        const { line: now, stop: end } = live.current;
        if (at === null || now === null) return at;
        const atMs = to(at);
        if (atMs >= now.toMs) end();
        return { ...at, atMs };
      });
    if (still) {
      const timer = setInterval(() => {
        const { line: now, timeZone: zone } = live.current;
        if (now !== null && zone !== null) step((at) => sunNextHour(now, at.atMs, zone));
      }, SUN_STEP_MS);
      return () => clearInterval(timer);
    }
    let frame = 0;
    let last: number | null = null;
    const tick = (time: number) => {
      const gap = last === null ? 0 : time - last;
      last = time;
      const now = live.current.line;
      if (now !== null) step((at) => sunPlayedTo(now, at.atMs, gap));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [on, still, setPick]);
}

/** The sun bar as the way back reads it: its chart first, then the bar (`studioBack`). */
export function sunBackOf(bar: SunBarState, moves: Pick<SunBarMoves, 'showSunChart' | 'closeSun'>) {
  return {
    sun:
      bar.view === null ? ('closed' as const) : bar.chart ? ('chart' as const) : ('bar' as const),
    closeSunChart: () => moves.showSunChart(false),
    closeSun: moves.closeSun,
  };
}

/**
 * The sun chart's compass (board G10): its points round from the start no day's sun passes, and
 * where an azimuth lies round from it, so every day draws as one arc.
 */
export function sunChartAxisOf(chart: SunChart | null) {
  const start = sunChartStartOf(chart?.days.map((day) => day.curve) ?? []);
  return {
    points: sunChartPoints(start),
    round: (azimuth: number) => chartAzimuth(azimuth, start),
  };
}
