'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import type { Ref } from 'react';
import { DrawHint } from './StudioBarPills';
import { StudioCompass, type StudioCompassHandle } from './StudioCompass';
import { useFilePick } from './StudioFilePick';
import { StudioLengthBox } from './StudioLengthBox';
import { StudioPictureCards } from './StudioPictureCards';
import { pictureCreditOf, StudioPictureChip, StudioPictureCredit } from './StudioPictureChip';
import { StudioPlanRow } from './StudioPlanRow';
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
  foot,
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
  /** On a phone, the canvas's foot, where the picture panel opens; `null` on a wide screen. */
  foot: HTMLElement | null;
}) {
  const { roofStep } = studio;
  return (
    <div ref={headRef} className="hg-studio-canvas-head">
      <HeadSteps studio={studio} parts={parts} words={words} onBack={onBack} onSite={onSite} />
      <StudioCompass handle={compass} words={words} off={parts.compass === 'hidden'} />
      <HeadPicture studio={studio} parts={parts} words={words} phone={phone} foot={foot} />
      <DrawHint studio={studio} words={words} />
      {roofStep.kind === 'sizing' ? (
        <StudioLengthBox sizing={roofStep} studio={studio} units={studio.units} words={words} />
      ) : null}
      <StudioPictureCards studio={studio} words={words} phone={phone} />
      {studio.sizeCard !== null ? (
        <StudioSizeCard
          card={studio.sizeCard}
          studio={studio}
          units={studio.units}
          words={words}
          phone={phone}
          credit={phone ? pictureCreditOf(studio.picture, words) : null}
        />
      ) : null}
    </div>
  );
}

/** The picture chip, or its credit line alone while a job is in hand. */
function HeadPicture({
  studio,
  parts,
  words,
  phone,
  foot,
}: {
  studio: StudioScreen;
  parts: FocusParts;
  words: StudioCanvasWords;
  phone: boolean;
  foot: HTMLElement | null;
}) {
  const format = useFormat();
  const pickFile = useFilePick();
  const { picture, editing, moves, document, roofStep } = studio;
  const editable = editing.kind === 'editor';
  const shown: PictureChoice = picture.kind === 'none' ? 'none' : (document?.picture ?? 'sky');
  // The sky picture's row names it, shown or not.
  const { skyFacts } = studio;
  const drawnOn = document?.drawnOn?.takenOn ?? null;
  if (parts.pictureChip === 'credit') {
    // On a phone your picture's open card and the size card carry the credit as their last line
    // (ruling 8): the card stands where the credit was.
    return phone && (studio.own.cardOpen || studio.sizeCard !== null) ? null : (
      <StudioPictureCredit picture={picture} words={words} />
    );
  }
  return (
    <StudioPictureChip
      picture={picture}
      shown={shown}
      // The first length stretches the picture: its sharpness is the picture as drawn.
      sharpness={
        skyFacts === null
          ? null
          : format.fineLength(
              skyFacts.metresPerPixel * (studio.shown?.pictureScale ?? 1),
              studio.units,
            )
      }
      takenOn={skyFacts?.takenOn == null ? null : format.monthYear(skyFacts.takenOn)}
      drawnOn={drawnOn === null ? null : format.monthYear(drawnOn)}
      words={words}
      canPick={editable && roofStep.kind === 'idle'}
      open={studio.picturesOpen}
      onOpen={moves.showPictures}
      onPick={moves.pickPicture}
      ownLine={ownLineOf(picture, words, format, studio.units)}
      onPickFile={pickFile}
      ownLaid={studio.document?.ownPicture != null}
      planRow={<StudioPlanRow plan={studio.own.plan} studio={studio} words={words} />}
      foot={foot}
    />
  );
}

/** Your picture's line on the chip: a photo's day, or a drone map's sharpness and day (board 2.1, 3.1). */
function ownLineOf(
  picture: StudioScreen['picture'],
  words: StudioCanvasWords,
  format: ReturnType<typeof useFormat>,
  units: StudioScreen['units'],
): string | null {
  if (picture.kind !== 'own') return null;
  const date = picture.takenOn === null ? null : format.date(picture.takenOn);
  if (picture.pictureKind === 'photo' || picture.metresPerPixel === null) return date;
  const sharpness = format.fineLength(picture.metresPerPixel, units);
  if (!picture.placeRead) return words.ownDronePlaceless(sharpness);
  return date === null ? sharpness : `${sharpness} · ${date}`;
}
