'use client';
import type { DesignDetail, TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import {
  ShellGlyph,
  useDesktopShell,
  useFormat,
  usePalette,
  useReducedMotion,
} from '@heliogrid/ui';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { useChromeRoom } from '../hooks/use-chrome-room';
import { useDrawPress } from '../hooks/use-draw-press';
import { useMapKeys } from '../hooks/use-map-keys';
import { StudioBottomBar } from './StudioBottomBar';
import type { StudioDrive } from './StudioCameraRig';
import { StudioCanvasHead } from './StudioCanvasHead';
import { StudioCanvasNotes } from './StudioCanvasNotes';
import { StudioLoupe } from './StudioLoupe';
import { StudioMapMarks, type StudioMapMarksHandle } from './StudioMapMarks';
import { StudioRoofMarks } from './StudioRoofMarks';
import type { RoofMarksHandle } from './StudioRoofs';
import { StudioToolRail } from './StudioToolRail';

/** The sun the scene is lit by before the site's own is known: high, so nothing waits on it. */
const NOON_OVERHEAD = { azimuthDegrees: 180, elevationDegrees: 60 } as const;

// The 3D library loads after the bars: the studio's own parts show first, the scene a beat later.
const StudioScene = dynamic(() => import('./StudioScene').then((scene) => scene.StudioScene), {
  ssr: false,
});

/**
 * The studio's canvas (`T-M05-002a`, `T-M05-002b`): the scene on the whole screen and the thin
 * glass parts over it — the top bar with the Saved pill, the step rail, the picture chip, the two
 * tool columns and the one bottom bar — and the marks on the roofs. While a roof is drawn, a tap on
 * the map places a corner and a drag still moves it; on a phone a finger held still aims with the
 * loupe. Focus mode sets aside every part the job in hand does not use. It holds only how the model
 * is seen and touched; every fact and every rule is the studio hook's.
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
  const desktop = useDesktopShell();
  const { frame, top, bottom, room } = useChromeRoom();
  const pin = useRef<HTMLSpanElement>(null);
  const drive = useRef<StudioDrive | null>(null);
  const marks = useRef<StudioMapMarksHandle>(null);
  const roofMarks = useRef<RoofMarksHandle>(null);
  const scene = useRef<HTMLDivElement>(null);
  // biome-ignore lint/plugin: whether the corner held is crowded on the screen, as the marks last laid it
  const [crowded, setCrowded] = useState(false);
  const rise = useRef(0);
  const onKeyDown = useMapKeys(drive);
  const { picture, editing, moves, view, sun, roofStep } = studio;
  const editable = editing.kind === 'editor';
  const drawing = roofStep.kind === 'drawing';
  const roofs = studio.shown?.roofs ?? [];
  const parts = studio.focus(desktop === false);

  const { aim, aimAt, handlers } = useDrawPress(studio, drive, (x, y) =>
    roofMarks.current?.revealAt(x, y),
  );
  // A roof that closes is framed in the room between the bars: the camera stays in the top view,
  // where its lengths are set next.
  const said = roofStep.kind === 'idle' ? roofStep.said : null;
  const closed = said?.kind === 'closed' ? said : null;

  return (
    <div ref={frame} className="hg-studio" data-view={view} data-drawing={drawing}>
      <div
        ref={scene}
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
          heights={studio.heights.map((height) => height.metres)}
          pictureScale={studio.shown?.pictureScale ?? 1}
          storeyHeightM={format.pack.storeyHeightM}
          fit={studio.fit}
          frameOn={closed}
          rise={rise}
          roofMarks={roofMarks}
        />
      </div>
      <StudioRoofMarks
        handle={roofMarks}
        studio={studio}
        view={view}
        units={studio.units}
        words={words}
        aiming={aim !== null}
        lengths={parts.lengthLabels}
        handles={parts.otherHandles}
        drive={drive}
        onAim={aimAt}
        onCrowded={setCrowded}
        map={scene}
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
        off={parts.compass === 'hidden'}
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
      <StudioCanvasHead
        headRef={top}
        studio={studio}
        parts={parts}
        name={name}
        words={words}
        onBack={onBack}
        onSite={onSite}
      />
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
        parts={parts}
        helpers={studio.helpers}
        buildingData={studio.buildingData}
        helpersRefused={studio.helpersRefused}
        hasRoof={studio.fit !== null}
        onRetryHelpers={moves.retryHelpers}
        words={words}
        onView={moves.see}
        onUnits={moves.chooseUnits}
        onUndo={moves.undo}
        onRedo={moves.redo}
        onDraw={drawing ? moves.cancel : moves.draw}
        onHelper={moves.toggleHelper}
        onAddRoof={moves.draw}
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
        part={parts.bottomBar}
        crowded={crowded}
      />
    </div>
  );
}
