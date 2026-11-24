'use client';
import type { DesignDetail, TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { ShellGlyph, useDesktopShell, usePalette, useReducedMotion } from '@heliogrid/ui';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChromeRoom } from '../hooks/use-chrome-room';
import { useDrawPress } from '../hooks/use-draw-press';
import { useMapKeys } from '../hooks/use-map-keys';
import { useNewestFrame } from '../hooks/use-newest-frame';
import { useStudioHaptics } from '../hooks/use-studio-haptics';
import { StudioBottomBar } from './StudioBottomBar';
import type { StudioDrive } from './StudioCameraRig';
import { StudioCanvasHead } from './StudioCanvasHead';
import { StudioCanvasNotes } from './StudioCanvasNotes';
import type { StudioCompassHandle } from './StudioCompass';
import { StudioFilePick } from './StudioFilePick';
import { StudioLoupe } from './StudioLoupe';
import { StudioMaterialPicker } from './StudioMaterialPicker';
import { StudioRoofMarks } from './StudioRoofMarks';
import { StudioRoofSheet } from './StudioRoofSheet';
import type { RoofMarksHandle } from './StudioRoofs';
import { StudioRoofsList } from './StudioRoofsList';
import { StudioToolRail } from './StudioToolRail';

/** A finger's half-width on the screen: a side or a ridge this near a tap is the one tapped. */
const FINGER_PX = 22;

/** The sun the scene is lit by before the site's own is known: high, so nothing waits on it. */
const NOON_OVERHEAD = { azimuthDegrees: 180, elevationDegrees: 60 } as const;

// The 3D library loads after the bars: the studio's own parts show first, the scene a beat later.
const StudioScene = dynamic(() => import('./StudioScene').then((scene) => scene.StudioScene), {
  ssr: false,
});

/**
 * The studio's canvas (`T-M05-002a`, `T-M05-002b`): the scene on the whole screen and the thin
 * glass parts over it — the steps with the save mark, the compass, the picture chip, the two
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
  const palette = usePalette();
  const still = useReducedMotion();
  const desktop = useDesktopShell();
  // The sheet takes the bar's place: the room is measured again when one swaps for the other.
  const { frame, top, bottom, side, room } = useChromeRoom(studio.roofSheet !== null);
  const pin = useRef<HTMLSpanElement>(null);
  const drive = useRef<StudioDrive | null>(null);
  const compass = useRef<StudioCompassHandle>(null);
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

  // A tap on the map: in the top view it is the plan's, or it shows a length that gave way; in 3D
  // it opens the roof it lands on, met at each roof's own height.
  useStudioHaptics(studio);
  const { aim, aimAt, handlers } = useDrawPress(studio, drive, (x, y) => {
    if (view !== 'top') {
      const at = (heightM: number) => drive.current?.groundAt(x, y, heightM) ?? null;
      moves.tapRoof(at, (h) => drive.current?.groundAt(x + FINGER_PX, y, h) ?? null);
      return;
    }
    const spot = drive.current?.groundAt(x, y, 0) ?? null;
    // Placing the stairs: the tap on an edge is theirs.
    const beside = drive.current?.groundAt(x + FINGER_PX, y, 0) ?? null;
    if (spot !== null && moves.tapStairs(spot, beside)) return;
    // The plan takes the tap next: an outline makes its roof (`T-M05-002d`, board 4.3).
    if (spot !== null && studio.ownMoves.tapPlan(spot)) return;
    roofMarks.current?.revealAt(x, y);
  });
  // A roof that closes is framed in the room between the bars: the camera stays in the top view,
  // where its lengths are set next.
  const said = roofStep.kind === 'idle' ? roofStep.said : null;
  // A roof's sheet frames its roof above the sheet: again once the sheet's room is measured, as
  // the sheet is taller than the bar it replaces.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the measured room is what asks for a new frame
  const sheetFraming = useMemo(
    () => (studio.sheetFrame === null ? null : {}),
    [studio.sheetFrame, room.bottom, room.right],
  );
  const closed = said?.kind === 'closed' ? said : null;
  // The size card opening frames its rectangle with the roofs, once: sliding then never moves the map.
  const typing = roofStep.kind === 'typing';
  const typingFrame = useMemo(() => (typing ? {} : null), [typing]);
  // The newest ask for a frame: a landing's own box is framed only while the landing is it.
  const frameOn = useNewestFrame([sheetFraming, typingFrame, closed, studio.own.landed]);
  // A later frame ends the landing, so the camera never flies back to it when that frame clears.
  const { landed } = studio.own;
  const { landingDone } = studio.ownMoves;
  useEffect(() => {
    if (landed !== null && frameOn !== landed) landingDone();
  }, [frameOn, landed, landingDone]);

  return (
    <StudioFilePick studio={studio} words={words}>
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
            onTurn={(turn) => compass.current?.turn(turn)}
            roofScene={studio.scene}
            pictureScale={studio.shown?.pictureScale ?? null}
            fit={
              frameOn === studio.own.landed ? (studio.own.landed?.box ?? studio.fit) : studio.fit
            }
            frameOn={frameOn}
            rise={rise}
            roofMarks={roofMarks}
            screen={studio.screenProjector}
            plan={studio.own.plan}
            planGlows={
              studio.own.plan !== null && !studio.own.plan.picked && !studio.own.plan.laid.locked
            }
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
          besideAt={(x, y) => drive.current?.groundAt(x + FINGER_PX, y, 0) ?? null}
          onAim={aimAt}
          onCrowded={setCrowded}
          map={scene}
        />
        {aim !== null ? (
          <StudioLoupe at={aim} studio={studio} units={studio.units} drive={drive} />
        ) : null}
        {/* The marker says what it is: a word beside it only repeats the glyph, so it is spoken alone. */}
        <span
          ref={pin}
          role="img"
          aria-label={words.pin}
          className="hg-studio-pin"
          data-hidden="true"
          data-gone={roofs.length > 0 || drawing}
        >
          <ShellGlyph name="pin" tone="current" />
        </span>
        <StudioCanvasHead
          headRef={top}
          compass={compass}
          studio={studio}
          parts={parts}
          words={words}
          onBack={onBack}
          onSite={onSite}
          phone={desktop === false}
        />
        <StudioCanvasNotes studio={studio} words={words} />
        <StudioToolRail
          studio={studio}
          view={view}
          views={studio.views}
          units={studio.units}
          editable={editable}
          canUndo={studio.canUndo}
          canRedo={studio.canRedo}
          newView={studio.offer3d}
          parts={parts}
          canWipe={studio.bar?.kind === 'drawing' && studio.bar.canWipe}
          onWipe={moves.wipe}
          words={words}
          onView={moves.see}
          onUnits={moves.chooseUnits}
          onUndo={moves.undo}
          onRedo={moves.redo}
          onZoomIn={() => drive.current?.zoomIn()}
          onZoomOut={() => drive.current?.zoomOut()}
          onHome={() => drive.current?.home()}
        />
        {studio.roofSheet !== null ? (
          <StudioRoofSheet
            footRef={bottom}
            sideRef={side}
            sheet={studio.roofSheet}
            studio={studio}
            units={studio.units}
            words={words}
            map={scene}
            phone={desktop === false}
          />
        ) : (
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
            magnet={parts.magnet}
            crowded={crowded}
            phone={desktop === false}
          />
        )}
        {studio.panel.open === 'roofs' ? (
          <StudioRoofsList studio={studio} units={studio.units} words={words} />
        ) : null}
        {studio.materialPicker === null ? null : (
          <StudioMaterialPicker picker={studio.materialPicker} studio={studio} words={words} />
        )}
      </div>
    </StudioFilePick>
  );
}
