'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, IconButton, ShellGlyph, useFormat } from '@heliogrid/ui';
import { useFilePick } from './StudioFilePick';

/**
 * Your picture's pills in the foot (`T-M05-002d`, board 1.3, 1.4, 4.1): the file being read, with ×;
 * a file not laid, with why and Pick another; the plan picked, with Lock, Hide and Remove.
 */

/** The file being read: the map stays live, and nothing on the design changes until it is read. */
function ReadingPill({
  name,
  studio,
  words,
}: {
  name: string;
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  return (
    <>
      <span className="hg-studio-pill-text" role="status">
        <span className="hg-studio-pill-spin" aria-hidden />
        {words.reading(name)}
      </span>
      <IconButton label={words.stopReading} variant="ghost" onClick={studio.ownMoves.stopReading}>
        <ShellGlyph name="close" size="md" />
      </IconButton>
    </>
  );
}

/** A file not laid: one line says why, and Pick another opens the picker again. */
function RefusedPill({ studio, words }: { studio: StudioScreen; words: StudioCanvasWords }) {
  const pick = useFilePick();
  const format = useFormat();
  const { job } = studio.own;
  if (job.kind !== 'refused') return null;
  const km = job.distanceKm === null ? null : format.number(Math.round(job.distanceKm * 10) / 10);
  return (
    <span className="hg-studio-pill-refused" role="alert">
      <ShellGlyph name="alert-circle" size="sm" />
      {words.pictureRefused(job.refusal, km)}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          studio.ownMoves.dismissRefusal();
          pick();
        }}
      >
        {words.pickAnother}
      </Button>
    </span>
  );
}

/** The plan picked: its own acts, and nothing the tools already offer (ruling 4). */
function PlanPill({ studio, words }: { studio: StudioScreen; words: StudioCanvasWords }) {
  const { plan } = studio.own;
  if (plan === null) return null;
  const { ownMoves } = studio;
  return (
    <>
      <IconButton
        label={words.lockPlan(false)}
        variant="ghost"
        onClick={() => ownMoves.lockPlan(true)}
      >
        <ShellGlyph name="lock" size="md" />
      </IconButton>
      <IconButton
        label={words.hidePlan(false)}
        variant="ghost"
        onClick={() => ownMoves.hidePlan(true)}
      >
        <ShellGlyph name="eye-off" size="md" />
      </IconButton>
      <IconButton label={words.removePlan} variant="ghost" onClick={ownMoves.removePlan}>
        <ShellGlyph name="trash" size="md" />
      </IconButton>
    </>
  );
}

/** The foot's pill for Your picture, or `null` when none of its jobs is in hand. */
export function picturePillOf(studio: StudioScreen, words: StudioCanvasWords) {
  const { job, plan } = studio.own;
  if (job.kind === 'reading') return <ReadingPill name={job.name} studio={studio} words={words} />;
  if (job.kind === 'refused') return <RefusedPill studio={studio} words={words} />;
  if (plan?.picked) return <PlanPill studio={studio} words={words} />;
  // The North or the unit card is the job: the foot is the slim pill, empty (board 2.1, 4.5).
  if (studio.own.cardOpen) return <span className="hg-studio-pill-text" />;
  return null;
}
