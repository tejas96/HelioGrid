'use client';
import type { DesignDetail, TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Button, ShellGlyph, useFormat, usePalette, useReducedMotion } from '@heliogrid/ui';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useChromeRoom } from '../hooks/use-chrome-room';
import { useMapKeys } from '../hooks/use-map-keys';
import { StudioBottomBar } from './StudioBottomBar';
import type { StudioDrive } from './StudioCameraRig';
import { StudioMapMarks, type StudioMapMarksHandle } from './StudioMapMarks';
import { StudioPictureChip } from './StudioPictureChip';
import { StudioStepSwitcher } from './StudioStepSwitcher';
import { StudioToolRail } from './StudioToolRail';
import { StudioTopBar } from './StudioTopBar';

/** The sun the scene is lit by before the site's own is known: high, so nothing waits on it. */
const NOON_OVERHEAD = { azimuthDegrees: 180, elevationDegrees: 60 } as const;

// The 3D library loads after the bars: the studio's own parts show first, the scene a beat later.
const StudioScene = dynamic(() => import('./StudioScene').then((scene) => scene.StudioScene), {
  ssr: false,
});

/**
 * The studio's canvas (`T-M05-002a`): the scene on the whole screen and the thin glass parts over
 * it — the top bar with the Saved pill, the step rail, the picture chip, the two tool columns and
 * the one bottom bar. It holds only how the model is seen; every fact is the studio hook's.
 */
export function StudioCanvas({
  detail,
  studio,
  name,
  words,
  onBack,
  onSite,
}: {
  detail: DesignDetail;
  studio: StudioScreen;
  name: TranslatedText;
  words: StudioCanvasWords;
  onBack: () => void;
  /** Back to Site details; `null` for a reader who cannot change the design. */
  onSite: (() => void) | null;
}) {
  const format = useFormat();
  const palette = usePalette();
  const still = useReducedMotion();
  const { frame, top, bottom, room } = useChromeRoom();
  const pin = useRef<HTMLSpanElement>(null);
  const drive = useRef<StudioDrive | null>(null);
  const marks = useRef<StudioMapMarksHandle>(null);
  const onKeyDown = useMapKeys(drive);
  const { picture, editing, saving, moves, view, sun } = studio;
  const editable = editing.kind === 'editor';
  const shown: PictureChoice =
    picture.kind === 'none' ? 'none' : (studio.document?.picture ?? 'sky');
  const sky = picture.kind === 'sky' ? picture : null;
  const status =
    picture.kind === 'none'
      ? words.noPictureWhy(picture.reason)
      : words.roofNotSetUp(detail.site.address);

  return (
    <div ref={frame} className="hg-studio" data-view={view}>
      <div
        className="hg-studio-scene"
        role="application"
        aria-label={words.mapKeys}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the map takes the focus to answer its keys, as a map does
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <StudioScene
          picture={picture}
          view={view}
          sun={sun ?? NOON_OVERHEAD}
          palette={palette}
          free={room}
          still={still}
          pinLabel={pin}
          fallback={<p className="hg-studio-no-scene">{words.noScene}</p>}
          drive={drive}
          onMarks={(seen) => marks.current?.show(seen)}
        />
      </div>
      <StudioMapMarks
        handle={marks}
        view={view}
        units={studio.units}
        scaleBar={studio.scaleBar}
        words={words}
      />
      <span ref={pin} className="hg-studio-pin" data-hidden="true">
        <ShellGlyph name="pin" size="sm" tone="current" />
        {words.pin}
      </span>
      <div ref={top} className="hg-studio-canvas-head">
        <StudioTopBar
          name={name}
          editing={editing}
          saving={saving}
          words={words}
          onBack={onBack}
          onRetry={moves.retry}
        />
        {/* While another person edits, the place stays: their roof is drawn on it. A change still
            on its way keeps the person here, or leaving would lose it. */}
        <StudioStepSwitcher
          rail={studio.rail}
          words={words}
          onSite={editable ? onSite : null}
          siteWaits={saving.kind !== 'saved'}
        />
        <StudioPictureChip
          picture={picture}
          shown={shown}
          sharpness={sky === null ? null : format.fineLength(sky.metresPerPixel, studio.units)}
          takenOn={sky?.takenOn == null ? null : format.monthYear(sky.takenOn)}
          words={words}
          canPick={editable}
          open={studio.picturesOpen}
          onOpen={moves.showPictures}
          onPick={moves.pickPicture}
        />
      </div>
      {saving.kind === 'saved-first' ? (
        <div className="hg-studio-glass hg-studio-note" role="alert">
          <ShellGlyph name="alert-circle" size="sm" />
          <span>
            {words.savedFirst(saving.savedBy?.name ?? null, format.clockAt(saving.savedAt))}
          </span>
          <Button variant="secondary" size="sm" onClick={moves.openTheirs}>
            {words.openTheirs}
          </Button>
        </div>
      ) : null}
      {saving.kind === 'closed' ? (
        <div className="hg-studio-glass hg-studio-note" role="status">
          <ShellGlyph name="lock" size="sm" />
          <span>{words.closed}</span>
        </div>
      ) : null}
      {studio.pictureUpdated ? (
        <div className="hg-studio-glass hg-studio-note" role="status">
          <ShellGlyph name="image" size="sm" />
          <span>{words.pictureUpdated}</span>
          <Button variant="secondary" size="sm" onClick={moves.pictureChecked}>
            {words.pictureChecked}
          </Button>
        </div>
      ) : null}
      <StudioToolRail
        view={view}
        views={studio.views}
        units={studio.units}
        editable={editable}
        canUndo={studio.canUndo}
        canRedo={studio.canRedo}
        words={words}
        onView={moves.see}
        onUnits={moves.chooseUnits}
        onUndo={moves.undo}
        onRedo={moves.redo}
        onZoomIn={() => drive.current?.zoomIn()}
        onZoomOut={() => drive.current?.zoomOut()}
        onHome={() => drive.current?.home()}
      />
      <StudioBottomBar
        barRef={bottom}
        name={name}
        status={status}
        noPicture={picture.kind === 'none'}
        editable={editable}
        words={words}
      />
    </div>
  );
}
