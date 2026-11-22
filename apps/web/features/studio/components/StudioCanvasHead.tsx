'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import type { Ref } from 'react';
import { DrawHint } from './StudioBarPills';
import { StudioCompass, type StudioCompassHandle } from './StudioCompass';
import { StudioLengthBox } from './StudioLengthBox';
import { StudioPictureChip, StudioPictureCredit } from './StudioPictureChip';
import { StudioSaveMark } from './StudioSaveMark';
import { StudioSizeCard } from './StudioSizeCard';
import { StudioStepSwitcher } from './StudioStepSwitcher';

/**
 * The steps with the save mark, or the mark alone while a job keeps the steps aside. While another person edits, the place stays: their roof is drawn on it. A change still
 * on its way keeps the person here, or leaving would lose it.
 */
function HeadSteps({
  studio,
  parts,
  words,
  onBack,
  onSite,
}: {
  studio: StudioScreen;
  parts: FocusParts;
  words: StudioCanvasWords;
  onBack: () => void;
  onSite: (() => void) | null;
}) {
  const { editing, saving, moves } = studio;
  const saveMark = (
    <StudioSaveMark
      editing={editing}
      saving={saving}
      words={words}
      onRetry={moves.retry}
      onLeave={onBack}
    />
  );
  return (
    <div
      className="hg-studio-head-part hg-studio-head-steps"
      data-hidden={parts.stepSwitcher === 'hidden'}
      inert={parts.stepSwitcher === 'hidden'}
    >
      {parts.stepSwitcher === 'mark' ? (
        <div className="hg-studio-steps">
          <div className="hg-studio-glass hg-studio-steps-pill">{saveMark}</div>
        </div>
      ) : (
        <StudioStepSwitcher
          rail={studio.rail}
          words={words}
          onSite={editing.kind === 'editor' ? onSite : null}
          siteWaits={saving.kind !== 'saved'}
          saveMark={saveMark}
          onLeave={onBack}
        />
      )}
    </div>
  );
}

/**
 * The canvas's head: the step switcher with the save mark, the compass and the picture chip. Focus
 * mode sets the switcher aside — a save that failed keeps its mark — and steps the chip down to its
 * credit line, which never leaves the screen.
 */
export function StudioCanvasHead({
  headRef,
  compass,
  studio,
  parts,
  words,
  onBack,
  onSite,
  phone,
}: {
  headRef: Ref<HTMLDivElement>;
  /** The compass in the head's right corner, which the camera turns. */
  compass: Ref<StudioCompassHandle>;
  studio: StudioScreen;
  parts: FocusParts;
  words: StudioCanvasWords;
  /** Out of the studio: the step before the roof for a reader who cannot open Site details. */
  onBack: () => void;
  /** Back to Site details; `null` for a reader who cannot change the design. */
  onSite: (() => void) | null;
  /** A phone-width screen: the size card holds Place roof while the keyboard is up. */
  phone: boolean;
}) {
  const format = useFormat();
  const { picture, editing, moves, document, roofStep } = studio;
  const editable = editing.kind === 'editor';
  const shown: PictureChoice = picture.kind === 'none' ? 'none' : (document?.picture ?? 'sky');
  const sky = picture.kind === 'sky' ? picture : null;
  const drawnOn = document?.drawnOn?.takenOn ?? null;
  return (
    <div ref={headRef} className="hg-studio-canvas-head">
      <HeadSteps studio={studio} parts={parts} words={words} onBack={onBack} onSite={onSite} />
      <StudioCompass handle={compass} words={words} off={parts.compass === 'hidden'} />
      {parts.pictureChip === 'credit' ? (
        <StudioPictureCredit picture={picture} />
      ) : (
        <StudioPictureChip
          picture={picture}
          shown={shown}
          // The first length stretches the picture: its sharpness is the picture as drawn.
          sharpness={
            sky === null
              ? null
              : format.fineLength(
                  sky.metresPerPixel * (studio.shown?.pictureScale ?? 1),
                  studio.units,
                )
          }
          takenOn={sky?.takenOn == null ? null : format.monthYear(sky.takenOn)}
          drawnOn={drawnOn === null ? null : format.monthYear(drawnOn)}
          words={words}
          canPick={editable && roofStep.kind === 'idle'}
          open={studio.picturesOpen}
          onOpen={moves.showPictures}
          onPick={moves.pickPicture}
        />
      )}
      <DrawHint studio={studio} words={words} />
      {roofStep.kind === 'sizing' ? (
        <StudioLengthBox sizing={roofStep} studio={studio} units={studio.units} words={words} />
      ) : null}
      {studio.sizeCard !== null ? (
        <StudioSizeCard
          card={studio.sizeCard}
          studio={studio}
          units={studio.units}
          words={words}
          phone={phone}
        />
      ) : null}
    </div>
  );
}
