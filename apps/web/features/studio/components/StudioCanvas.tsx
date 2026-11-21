'use client';
import type { DesignDetail, TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { PictureChoice } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { ShellGlyph, useFormat, usePalette, useReducedMotion } from '@heliogrid/ui';
import dynamic from 'next/dynamic';
import { useMemo, useRef } from 'react';
import { useChromeRoom } from '../hooks/use-chrome-room';
import { useDrawPress } from '../hooks/use-draw-press';
import { useMapKeys } from '../hooks/use-map-keys';
import { usePictureThumb } from '../hooks/use-picture-thumb';
import { StudioBottomBar } from './StudioBottomBar';
import type { GroundBox, StudioDrive } from './StudioCameraRig';
import { StudioCanvasNotes } from './StudioCanvasNotes';
import { StudioLengthBox } from './StudioLengthBox';
import { StudioLoupe } from './StudioLoupe';
import { StudioMapMarks, type StudioMapMarksHandle } from './StudioMapMarks';
import { StudioPictureChip } from './StudioPictureChip';
import { StudioRoofMarks } from './StudioRoofMarks';
import type { RoofMarksHandle } from './StudioRoofs';
import { StudioStepSwitcher } from './StudioStepSwitcher';
import { StudioToolRail } from './StudioToolRail';
import { StudioTopBar } from './StudioTopBar';

/** The sun the scene is lit by before the site's own is known: high, so nothing waits on it. */
const NOON_OVERHEAD = { azimuthDegrees: 180, elevationDegrees: 60 } as const;

// The 3D library loads after the bars: the studio's own parts show first, the scene a beat later.
const StudioScene = dynamic(() => import('./StudioScene').then((scene) => scene.StudioScene), {
  ssr: false,
});

/** The ground the roofs cover, which Back to the pin frames; `null` before a roof. */
function roofsBox(studio: StudioScreen): GroundBox | null {
  const corners = studio.document?.roofs.flatMap((roof) => roof.corners) ?? [];
  if (corners.length === 0) return null;
  return {
    west: Math.min(...corners.map((c) => c.east)),
    east: Math.max(...corners.map((c) => c.east)),
    south: Math.min(...corners.map((c) => c.north)),
    north: Math.max(...corners.map((c) => c.north)),
  };
}

/** The picture chip's facts: which picture shows, how sharp, when taken, and when drawn on. */
function chipFactsOf(studio: StudioScreen, format: ReturnType<typeof useFormat>) {
  const { picture, document } = studio;
  const sky = picture.kind === 'sky' ? picture : null;
  const drawnOn = document?.drawnOn?.takenOn ?? null;
  const shown: PictureChoice = picture.kind === 'none' ? 'none' : (document?.picture ?? 'sky');
  return {
    shown,
    sharpness: sky === null ? null : format.pictureDetail(sky.metresPerPixel, studio.units),
    takenOn: sky?.takenOn == null ? null : format.monthYear(sky.takenOn),
    drawnOn: drawnOn === null ? null : format.monthYear(drawnOn),
  };
}

/**
 * The studio's canvas (`T-M05-002a`, `T-M05-002b`): the scene on the whole screen and the thin
 * glass parts over it — the top bar with the Saved pill, the step rail, the picture chip, the
 * length box, the two tool columns and the one bottom bar — and the marks on the roofs. While a
 * roof is drawn, a tap on the map places a corner and a drag still moves it; on a phone a finger
 * held still aims with the loupe. It holds only how the model is seen and touched; every fact and
 * every rule is the studio hook's.
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
  const roofMarks = useRef<RoofMarksHandle>(null);
  const rise = useRef(0);
  const onKeyDown = useMapKeys(drive);
  const { picture, editing, saving, moves, view, sun, roofStep } = studio;
  const editable = editing.kind === 'editor';
  const drawing = roofStep.kind === 'drawing';
  const roofs = studio.shown?.roofs ?? [];
  const pictureScale = studio.shown?.pictureScale ?? 1;
  const fit = useMemo(() => roofsBox(studio), [studio]);

  const { aim, handlers } = useDrawPress(studio, drive);
  const [thumb, onThumb] = usePictureThumb();

  return (
    <div ref={frame} className="hg-studio" data-view={view} data-drawing={drawing}>
      <div
        className="hg-studio-scene"
        role="application"
        aria-label={words.mapKeys}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the map takes the focus to answer its keys, as a map does
        tabIndex={0}
        onKeyDown={onKeyDown}
        {...handlers}
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
          roofs={roofs}
          pictureScale={pictureScale}
          fit={fit}
          rise={rise}
          roofMarks={roofMarks}
          onThumb={onThumb}
        />
      </div>
      <StudioRoofMarks
        handle={roofMarks}
        studio={studio}
        view={view}
        units={studio.units}
        words={words}
        drive={drive}
        rise={rise}
        aiming={aim !== null}
      />
      {aim !== null ? (
        <StudioLoupe at={aim} studio={studio} units={studio.units} drive={drive} />
      ) : null}
      <StudioMapMarks
        handle={marks}
        view={view}
        units={studio.units}
        scaleBar={studio.scaleBar}
        words={words}
        off={roofStep.kind === 'sizing'}
      />
      <span
        ref={pin}
        className="hg-studio-pin"
        data-hidden="true"
        data-gone={roofs.length > 0 || drawing}
      >
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
          thumb={thumb}
          {...chipFactsOf(studio, format)}
          words={words}
          canPick={editable && roofStep.kind === 'idle'}
          open={studio.picturesOpen}
          onOpen={moves.showPictures}
          onPick={moves.pickPicture}
        />
        {roofStep.kind === 'sizing' ? (
          <StudioLengthBox sizing={roofStep} studio={studio} units={studio.units} words={words} />
        ) : null}
      </div>
      <StudioCanvasNotes studio={studio} words={words} />
      <StudioToolRail
        view={view}
        views={studio.views}
        units={studio.units}
        editable={editable}
        canUndo={studio.canUndo}
        canRedo={studio.canRedo}
        drawing={drawing}
        newView={studio.offer3d}
        words={words}
        onView={moves.see}
        onUnits={moves.chooseUnits}
        onUndo={moves.undo}
        onRedo={moves.redo}
        onDraw={drawing ? moves.cancel : moves.draw}
        onZoomIn={() => drive.current?.zoomIn()}
        onZoomOut={() => drive.current?.zoomOut()}
        onHome={() => drive.current?.home()}
      />
      <StudioBottomBar
        barRef={bottom}
        name={name}
        studio={studio}
        view={view}
        units={studio.units}
        editing={editing}
        place={detail.site.address}
        words={words}
      />
    </div>
  );
}
