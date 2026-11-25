'use client';
import type { StepPlace, StudioStep } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, IconButton, Menu, type MenuItem, ShellGlyph } from '@heliogrid/ui';
import { standingsOf } from './StudioStepLine';

/**
 * The studio's steps, straight on the map in the head's middle (`T-M05-002a`): the step in hand —
 * a press lists every step, done, in hand or locked with its reason — with the step before and the
 * step after on each side; how far the design has come is the line on the screen's top edge
 * (`StudioStepLine`). The way to the site is the step before the roof: a press opens Site details
 * again, whose head leads out of the studio; for a reader who cannot change the site it leads out
 * at once.
 */
export function StudioStepSwitcher({
  rail,
  words,
  onSite,
  siteWaits,
  onLeave,
  numbered,
}: {
  /** The step in hand shows its number; a phone shows its name alone, the top line says how far. */
  numbered: boolean;
  rail: readonly StepPlace[];
  words: StudioCanvasWords;
  /** Back to Site details; `null` for a reader who cannot change the design. */
  onSite: (() => void) | null;
  /** A change is still on its way: the site waits for it, with its reason. */
  siteWaits: boolean;
  /** Out of the studio: where the step before the roof leads a reader who cannot open the site. */
  onLeave: () => void;
}) {
  const standings = standingsOf(rail);
  const hereAt = standings.indexOf('here');
  const here = rail[hereAt];
  if (here === undefined) return null;
  const before = rail[hereAt - 1];
  const after = rail[hereAt + 1];

  /** What a press on a step does, or why it does nothing; `null` for the step in hand. */
  const reach = (step: StudioStep, lock: StepPlace['lock']) => {
    if (lock !== null) return { reason: words.stepLock(lock) } as const;
    // An open step after the roof is not built yet: it says so, never a silent grey press.
    if (step !== 'site') return { reason: words.stepComing } as const;
    if (onSite === null) return null;
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
        <IconButton label={words.back} variant="ghost" onClick={onLeave}>
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
      {side(before, 'before')}
      <Menu
        label={words.stepsSoFar(hereAt + 1, rail.length)}
        selection="single"
        align="end"
        items={items}
        trigger={
          <Button variant="ghost" size="sm" iconRight={<ShellGlyph name="chevron" size="sm" />}>
            {numbered ? words.stepNumbered(hereAt + 1, here.step) : words.step(here.step)}
          </Button>
        }
      />
      {side(after, 'after')}
    </nav>
  );
}
