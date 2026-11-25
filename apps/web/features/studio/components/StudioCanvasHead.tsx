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
import { pictureCreditOf, StudioPictureChip } from './StudioPictureChip';
import { StudioPlanRow } from './StudioPlanRow';
import { StudioSaveMark } from './StudioSaveMark';
import { StudioSizeCard } from './StudioSizeCard';
import { StudioStepLine } from './StudioStepLine';
import { StudioStepSwitcher } from './StudioStepSwitcher';

/**
 * The head's middle: the steps, while no job keeps them aside. While another person edits, the place
 * stays: their roof is drawn on it. A change still on its way keeps the person here, or leaving would
 * lose it.
 */
function HeadSteps({
  studio,
  parts,
  words,
  onBack,
  onSite,
  phone,
}: {
  studio: StudioScreen;
  parts: FocusParts;
  words: StudioCanvasWords;
  onBack: () => void;
  onSite: (() => void) | null;
  phone: boolean;
}) {
  const { editing, saving } = studio;
  const shown = parts.stepSwitcher === 'shown';
  return (
    <div className="hg-studio-head-part hg-studio-head-steps" data-hidden={!shown} inert={!shown}>
      <StudioStepSwitcher
        rail={studio.rail}
        words={words}
        onSite={editing.kind === 'editor' ? onSite : null}
        siteWaits={saving.kind !== 'saved'}
        onLeave={onBack}
        numbered={!phone}
      />
    </div>
  );
}

/**
 * The head's end: the place that grows. A new option of the whole design stands here, before the
 * save mark and the compass, which keep the last two places. Room at the end, a ⋯ included: five on
 * a laptop, four on a tablet or a phone held sideways, one on an upright phone; the options past it
 * wait behind one ⋯ in their rank's order, and when they all fit there is no ⋯. A tool that changes
 * the model belongs to the tool columns, a setting to View, a step's main act to the foot.
 */
function HeadEnd({
  studio,
  parts,
  words,
  onBack,
  compass,
}: {
  studio: StudioScreen;
  parts: FocusParts;
  words: StudioCanvasWords;
  onBack: () => void;
  compass: Ref<StudioCompassHandle>;
}) {
  const { editing, saving, moves } = studio;
  const marked = parts.stepSwitcher !== 'hidden';
  return (
    <div className="hg-studio-head-end">
      <div className="hg-studio-head-part" data-hidden={!marked} inert={!marked}>
        <StudioSaveMark
          editing={editing}
          saving={saving}
          words={words}
          onRetry={moves.retry}
          onLeave={onBack}
        />
      </div>
      <StudioCompass handle={compass} words={words} off={parts.compass === 'hidden'} />
    </div>
  );
}

/**
 * The canvas's head, straight on the map with no box: the picture at the start, the steps in the
 * middle, the save mark and the compass at the end, over a soft shade that keeps them readable on
 * any roof; the line on the screen's top edge says how far the design has come. Focus mode sets the
 * steps aside — a save that failed keeps its mark — and steps the picture down to its thumb.
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
    <>
      <span className="hg-studio-head-shade" aria-hidden="true" />
      <StudioStepLine rail={studio.rail} />
      <div ref={headRef} className="hg-studio-canvas-head">
        <HeadPicture studio={studio} parts={parts} words={words} foot={foot} />
        <HeadSteps
          studio={studio}
          parts={parts}
          words={words}
          onBack={onBack}
          onSite={onSite}
          phone={phone}
        />
        <HeadEnd studio={studio} parts={parts} words={words} onBack={onBack} compass={compass} />
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
    </>
  );
}

/** The picture button, or its thumb alone while a job is in hand. */
function HeadPicture({
  studio,
  parts,
  words,
  foot,
}: {
  studio: StudioScreen;
  parts: FocusParts;
  words: StudioCanvasWords;
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
  return (
    <StudioPictureChip
      thumbOnly={parts.pictureChip === 'thumb'}
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
