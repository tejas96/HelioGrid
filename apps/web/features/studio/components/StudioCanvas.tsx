'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { ShellGlyph, useDesktopShell, usePalette, useReducedMotion } from '@heliogrid/ui';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCanvasLidar } from '../hooks/use-canvas-lidar';
import { useChromeRoom } from '../hooks/use-chrome-room';
import { useDrawPress } from '../hooks/use-draw-press';
import { useFacesFrame } from '../hooks/use-faces-frame';
import { useFootSlot } from '../hooks/use-foot-slot';
import { useKeyboardRoom } from '../hooks/use-keyboard-room';
import { useLidarPress, withLidarPress } from '../hooks/use-lidar-press';
import { useMapKeys } from '../hooks/use-map-keys';
import { useNewestFrame, useSheetFraming } from '../hooks/use-newest-frame';
import { useStudioHaptics } from '../hooks/use-studio-haptics';
import { useSunSky } from '../hooks/use-sun-sky';
import { useUpright } from '../hooks/use-upright';
import type { SceneFit } from './camera-poses';
import { footHolderOf, footRefsOf, panelFrames } from './canvas-foot';
import { StudioBottomBar } from './StudioBottomBar';
import type { StudioDrive } from './StudioCameraRig';
import { StudioCanvasHead } from './StudioCanvasHead';
import type { StudioCompassHandle } from './StudioCompass';
import { StudioFilePick } from './StudioFilePick';
import { lidarShown, StudioLidarParts } from './StudioLidar';
import { pinAnchorsOf } from './StudioLidarPins';
import { StudioLoupe } from './StudioLoupe';
import { StudioMaterialPicker } from './StudioMaterialPicker';
import { StudioRoofMarks } from './StudioRoofMarks';
import { StudioRoofSheet } from './StudioRoofSheet';
import type { RoofMarksHandle } from './StudioRoofs';
import { StudioRoofsList } from './StudioRoofsList';
import { StudioSunFoot } from './StudioSunChart';
import { StudioToolRail } from './StudioToolRail';

/** A finger's half-width on the screen: a side or a ridge this near a tap is the one tapped. */
const FINGER_PX = 22;

/**
 * What the camera frames: a landed picture's own box while its landing is the newest frame, else
 * the roofs, looked at the open roof's top.
 */
function sceneFitOf(studio: StudioScreen, frameOn: object | null): SceneFit | null {
  const { landed } = studio.own;
  if (frameOn === landed && landed !== null) return landed.box;
  return studio.fit === null ? null : { ...studio.fit, upM: studio.fitUpM };
}

/** The sun the scene is lit by before the site's own is known: high, so nothing waits on it. */
const NOON_OVERHEAD = { azimuthDegrees: 180, elevationDegrees: 60 } as const;

// The 3D library loads after the bars: the studio's own parts show first, the scene a beat later.
// Until it comes, a dark stage holds its place, so the head's white marks read from the first frame.
const StudioScene = dynamic(() => import('./StudioScene').then((scene) => scene.StudioScene), {
  ssr: false,
  loading: () => <div className="hg-studio-scene-wait" aria-hidden="true" />,
});

/**
 * The studio's canvas (`T-M05-002a`, `T-M05-002b`): the scene on the whole screen and the thin
 * glass parts over it — the steps with the save mark, the compass, the picture chip, the two
 * tool columns and the one bottom bar, there only with a message — and the marks on the roofs. While a roof is drawn, a tap on
 * the map places a corner and a drag still moves it; on a phone a finger held still aims with the
 * loupe. Focus mode sets aside every part the job in hand does not use. It holds only how the model
 * is seen and touched; every fact and every rule is the studio hook's.
 */
export function StudioCanvas({
  studio,
  words,
  onBack,
  onSite,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  onBack: () => void;
  /** Back to Site details; `null` for a reader who cannot change the design. */
  onSite: (() => void) | null;
}) {
  const palette = usePalette();
  const drive = useRef<StudioDrive | null>(null);
  const lidarPress = useLidarPress(studio, drive);
  const lidar = useCanvasLidar(studio, palette);
  const pins = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const desktop = useDesktopShell();
  const footHolder = footHolderOf(studio);
  const { frame, top, bottom, room } = useChromeRoom(footHolder);
  useKeyboardRoom(frame);
  // A phone held sideways lays its panels and tools out as a desktop does.
  const upright = useUpright(frame);
  const foot = footRefsOf(footHolder, bottom);
  const pin = useRef<HTMLSpanElement>(null);
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
  // An upright phone opens its panels at the foot, in the tools' place.
  const phoneFoot = desktop === false && upright;
  const parts = studio.focus(phoneFoot);
  const sunSky = useSunSky(studio, phoneFoot);

  // A tap on the map: in the top view it is the plan's, or it shows a length that gave way; in 3D
  // it opens the roof it lands on, met at each roof's own height.
  useStudioHaptics(studio);
  const { aim, aimAt, handlers } = useDrawPress(studio, drive, (x, y) => {
    studio.lidar.moves.why(false);
    if (view !== 'top') {
      const at = (heightM: number) => drive.current?.groundAt(x, y, heightM) ?? null;
      const beside = (h: number) => drive.current?.groundAt(x + FINGER_PX, y, h) ?? null;
      // With LiDAR on, a tap picks the roof's building for Move; else it opens the roof's sheet.
      (lidarShown(studio) ? studio.lidar.moves.tapAt : moves.tapRoof)(at, beside);
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
  // A roof's sheet, Roofs or the picker frames the roofs above it; a held arrow's frame waits.
  const { arrowHeld } = studio;
  const panelUp = panelFrames(footHolder, studio);
  const sheetFraming = useSheetFraming(panelUp, studio.sheetFrame, room.bottom, arrowHeld);
  const closed = said?.kind === 'closed' ? said : null;
  // The size card opening frames its rectangle with the roofs, once: sliding then never moves the map.
  const typing = roofStep.kind === 'typing';
  const typingFrame = useMemo(() => (typing ? {} : null), [typing]);
  // The newest ask for a frame: a landing's own box is framed only while the landing is it.
  const facesFrame = useFacesFrame(roofStep, room);
  const frameOn = useNewestFrame([
    sheetFraming,
    typingFrame,
    facesFrame,
    closed,
    studio.own.landed,
  ]);
  // A later frame ends the landing, so the camera never flies back to it when that frame clears.
  const { landed } = studio.own;
  const { landingDone } = studio.ownMoves;
  useEffect(() => {
    if (landed !== null && frameOn !== landed) landingDone();
  }, [frameOn, landed, landingDone]);

  const footSlot = useFootSlot(phoneFoot);

  return (
    <StudioFilePick studio={studio} words={words}>
      <div
        ref={frame}
        className="hg-studio"
        data-view={view}
        data-drawing={drawing}
        data-panel={footHolder !== 'bar'}
        data-sun={phoneFoot && footHolder === 'sun'}
        data-lidar={lidarShown(studio)}
      >
        <div
          ref={scene}
          className="hg-studio-scene"
          role="application"
          aria-label={words.mapKeys}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: the map takes the focus to answer its keys, as a map does
          tabIndex={0}
          onKeyDown={onKeyDown}
          {...withLidarPress(lidarPress, handlers)}
        >
          <StudioScene
            picture={picture}
            view={view}
            sun={sun ?? NOON_OVERHEAD}
            palette={palette}
            free={room}
            still={still}
            heldView={studio.heldView}
            pinLabel={pin}
            fallback={<p className="hg-studio-no-scene">{words.noScene}</p>}
            drive={drive}
            onTurn={lidar.told((turn) => compass.current?.turn(turn))}
            roofScene={studio.scene}
            roofMotion={studio.motion}
            pictureScale={studio.shown?.pictureScale ?? null}
            fit={sceneFitOf(studio, frameOn)}
            frameOn={frameOn}
            arrowHeld={arrowHeld}
            rise={rise}
            roofMarks={roofMarks}
            screen={studio.screenProjector}
            lidar={{ ...lidar.layer, pins: { holder: pins, anchors: pinAnchorsOf(studio) } }}
            sunSky={sunSky}
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
          fingerAt={(x, y) => ({
            here: drive.current?.groundAt(x, y, 0) ?? null,
            beside: drive.current?.groundAt(x + FINGER_PX, y, 0) ?? null,
          })}
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
          foot={footSlot.node}
        />
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
          foot={footSlot.node}
          onWipe={moves.wipe}
          words={words}
          onView={moves.see}
          onUnits={moves.chooseUnits}
          onUndo={moves.undo}
          onRedo={moves.redo}
          onZoomIn={() => drive.current?.zoomIn()}
          onZoomOut={() => drive.current?.zoomOut()}
        />
        <StudioLidarParts
          studio={studio}
          words={words}
          phone={desktop === false}
          holder={footHolder}
          foot={foot}
          pins={pins}
          turnOf={lidar.turnOf}
        />
        {studio.roofSheet === null ? null : (
          <StudioRoofSheet
            footRef={foot.sheet}
            covered={footHolder === 'picker'}
            sheet={studio.roofSheet}
            studio={studio}
            units={studio.units}
            words={words}
            map={scene}
            phone={desktop === false}
          />
        )}
        <StudioBottomBar
          barRef={foot.bar}
          studio={studio}
          view={view}
          units={studio.units}
          editing={editing}
          words={words}
          part={parts.bottomBar}
          crowded={crowded}
          phone={desktop === false}
          sheet={footHolder !== 'bar'}
          onAway={() => scene.current?.focus()}
        />
        {footHolder === 'sun' ? (
          <StudioSunFoot studio={studio} words={words} phone={phoneFoot} footRef={foot.sun} />
        ) : null}
        {studio.panel.open === 'roofs' ? (
          <StudioRoofsList
            footRef={foot.roofs}
            studio={studio}
            units={studio.units}
            words={words}
          />
        ) : null}
        <div ref={footSlot.ref} className="hg-studio-foot-slot" />
        {studio.materialPicker === null ? null : (
          <StudioMaterialPicker
            footRef={bottom}
            picker={studio.materialPicker}
            studio={studio}
            words={words}
          />
        )}
      </div>
    </StudioFilePick>
  );
}
