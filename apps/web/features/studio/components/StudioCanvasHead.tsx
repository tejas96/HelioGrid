'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import type { Ref } from 'react';
import { StudioLengthBox } from './StudioLengthBox';
import { StudioPictureChip, StudioPictureCredit } from './StudioPictureChip';
import { StudioStepSwitcher } from './StudioStepSwitcher';
import { StudioTopBar } from './StudioTopBar';

/**
 * The canvas's head: the top bar with the Saved pill, the step switcher and the picture chip. Focus
 * mode sets the bar and the switcher aside and steps the chip down to its credit line, which never
 * leaves the screen.
 */
export function StudioCanvasHead({
  headRef,
  studio,
  parts,
  name,
  words,
  onBack,
  onSite,
}: {
  headRef: Ref<HTMLDivElement>;
  studio: StudioScreen;
  parts: FocusParts;
  name: TranslatedText;
  words: StudioCanvasWords;
  onBack: () => void;
  /** Back to Site details; `null` for a reader who cannot change the design. */
  onSite: (() => void) | null;
}) {
  const format = useFormat();
  const { picture, editing, saving, moves, document, roofStep } = studio;
  const editable = editing.kind === 'editor';
  const shown: PictureChoice = picture.kind === 'none' ? 'none' : (document?.picture ?? 'sky');
  const sky = picture.kind === 'sky' ? picture : null;
  const drawnOn = document?.drawnOn?.takenOn ?? null;
  return (
    <div ref={headRef} className="hg-studio-canvas-head">
      <div
        className="hg-studio-head-part"
        data-hidden={parts.topBar === 'hidden'}
        inert={parts.topBar === 'hidden'}
      >
        <StudioTopBar
          name={name}
          editing={editing}
          saving={saving}
          words={words}
          onBack={onBack}
          onRetry={moves.retry}
        />
      </div>
      {/* While another person edits, the place stays: their roof is drawn on it. A change still
          on its way keeps the person here, or leaving would lose it. */}
      <div
        className="hg-studio-head-part"
        data-hidden={parts.stepSwitcher === 'hidden'}
        inert={parts.stepSwitcher === 'hidden'}
      >
        <StudioStepSwitcher
          rail={studio.rail}
          words={words}
          onSite={editable ? onSite : null}
          siteWaits={saving.kind !== 'saved'}
        />
      </div>
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
      {roofStep.kind === 'sizing' ? (
        <StudioLengthBox sizing={roofStep} studio={studio} units={studio.units} words={words} />
      ) : null}
    </div>
  );
}
