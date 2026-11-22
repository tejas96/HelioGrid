'use client';
import type { StepPlace, StudioStep } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { Button, IconButton, Menu, type MenuItem, ShellGlyph } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { useOwnSize } from '../hooks/use-own-size';

/** The border's line, and the gap between two steps' pieces of it, in CSS pixels. */
const LINE_PX = 3;
const GAP_PX = 6;
/** The whole border, as the drawing counts it: each step's piece is a sixth of it. */
const BORDER_UNITS = 1_000;

type Standing = 'done' | 'here' | 'ahead';

/** Where each step stands: the steps before the one in hand are done, the ones after it ahead. */
function standingsOf(rail: readonly StepPlace[]): Standing[] {
  const here = rail.findIndex((place) => place.here);
  return rail.map((_, at) => (at < here ? 'done' : at === here ? 'here' : 'ahead'));
}

/**
 * The pill's border, cut into one piece a step, running clockwise from the top left: a done step's
 * piece is filled, the one in hand is lit, the ones ahead are a quiet track. Drawn over the pill's
 * own edge, so how far the design has come takes no room of its own.
 */
function ProgressBorder({
  standings,
  size,
}: {
  standings: readonly Standing[];
  size: { readonly width: number; readonly height: number };
}) {
  const inset = LINE_PX / 2;
  const width = size.width - LINE_PX;
  const height = size.height - LINE_PX;
  const radius = height / 2;
  const perimeter = 2 * (width - 2 * radius) + 2 * Math.PI * radius;
  const piece = BORDER_UNITS / standings.length;
  const gap = (GAP_PX / perimeter) * BORDER_UNITS;
  return (
    <svg
      className="hg-studio-steps-border"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden="true"
    >
      {standings.map((standing, at) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: one piece a step, in the steps' own order
          key={at}
          data-standing={standing}
          x={inset}
          y={inset}
          width={width}
          height={height}
          rx={radius}
          pathLength={BORDER_UNITS}
          strokeDasharray={`0 ${at * piece + gap / 2} ${piece - gap} ${BORDER_UNITS}`}
        />
      ))}
    </svg>
  );
}

/**
 * The studio's steps in one pill (`T-M05-002a`): the step in hand with its number in the middle —
 * a press lists every step, done, in hand or locked with its reason — the step before and the step
 * after on each side, and the pill's own border showing how far the design has come. The way to the
 * site is the step before the roof: a press opens Site details again, whose head leads out of the
 * studio; for a reader who cannot change the site it leads out at once. The save mark sits after
 * the step in hand, before the step after.
 */
export function StudioStepSwitcher({
  rail,
  words,
  onSite,
  siteWaits,
  saveMark,
  onLeave,
}: {
  rail: readonly StepPlace[];
  words: StudioCanvasWords;
  /** Back to Site details; `null` for a reader who cannot change the design. */
  onSite: (() => void) | null;
  /** A change is still on its way: the site waits for it, with its reason. */
  siteWaits: boolean;
  /** Where saving stands (`StudioSaveMark`). */
  saveMark: ReactNode;
  /** Out of the studio: where the step before the roof leads a reader who cannot open the site. */
  onLeave: () => void;
}) {
  const [pill, size] = useOwnSize<HTMLDivElement>();
  const standings = standingsOf(rail);
  const hereAt = standings.indexOf('here');
  const here = rail[hereAt];
  if (here === undefined) return null;
  const before = rail[hereAt - 1];
  const after = rail[hereAt + 1];

  /** What a press on a step does, or why it does nothing; `null` for the step in hand. */
  const reach = (step: StudioStep, lock: StepPlace['lock']) => {
    if (lock !== null) return { reason: words.stepLock(lock) } as const;
    if (step !== 'site' || onSite === null) return null;
    return siteWaits ? ({ reason: words.siteWaitsForSave } as const) : ({ open: onSite } as const);
  };

  const items: MenuItem[] = rail.map((place, at) => {
    const go = place.here ? null : reach(place.step, place.lock);
    const standing = standings[at];
    return {
      key: place.step,
      label: words.stepNumbered(at + 1, place.step),
      selected: place.here,
      ...(place.lock !== null
        ? { icon: <ShellGlyph name="lock" size="sm" tone="current" /> }
        : standing === 'done'
          ? {
              icon: <ShellGlyph name="circle-check" size="sm" tone="success" />,
              meta: words.stepDone,
            }
          : {}),
      ...(go === null || place.here
        ? {}
        : 'open' in go
          ? { onSelect: go.open }
          : { disabled: true, disabledReason: go.reason }),
    };
  });

  /** The side button's name: the site by what a press does there, any other step by its name. */
  const sideLabel = (place: StepPlace, toward: 'before' | 'after') => {
    if (toward === 'after') return words.nextStep(place.step);
    return place.step === 'site' ? words.changeSite : words.previousStep(place.step);
  };

  const side = (place: StepPlace | undefined, toward: 'before' | 'after') => {
    if (place === undefined) return null;
    if (place.step === 'site' && onSite === null) {
      return (
        <IconButton
          label={words.back}
          variant="ghost"
          size={theme.layout['button-h-sm']}
          onClick={onLeave}
        >
          <ShellGlyph name="chevron-left" size="md" />
        </IconButton>
      );
    }
    const go = reach(place.step, place.lock);
    const label = sideLabel(place, toward);
    return (
      <IconButton
        label={label}
        variant="ghost"
        size={theme.layout['button-h-sm']}
        {...(go !== null && 'open' in go
          ? { onClick: go.open }
          : {
              disabled: true,
              ...(go !== null && 'reason' in go ? { disabledReason: go.reason } : {}),
            })}
      >
        <ShellGlyph name={toward === 'before' ? 'chevron-left' : 'chevron-right'} size="md" />
      </IconButton>
    );
  };

  return (
    <nav className="hg-studio-steps" aria-label={words.steps}>
      <div ref={pill} className="hg-studio-glass hg-studio-steps-pill">
        {size === null ? null : <ProgressBorder standings={standings} size={size} />}
        {side(before, 'before')}
        <Menu
          label={words.stepsSoFar(hereAt + 1, rail.length)}
          selection="single"
          align="start"
          items={items}
          trigger={
            <Button variant="ghost" size="sm" iconRight={<ShellGlyph name="chevron" size="sm" />}>
              {words.stepNumbered(hereAt + 1, here.step)}
            </Button>
          }
        />
        {saveMark}
        {side(after, 'after')}
      </div>
    </nav>
  );
}
