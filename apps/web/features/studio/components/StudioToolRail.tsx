'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, StudioView, ViewPlace } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, ShellGlyph } from '@heliogrid/ui';
import { useRef } from 'react';
import { MagnetSwitch } from './StudioBarPills';
import { LidarButton } from './StudioLidar';
import { StudioPencil } from './StudioPencil';
import { StudioRoofsButton } from './StudioRoofsButton';
import { Shown } from './StudioShown';
import { StudioViewPanel } from './StudioViewPanel';

/** The magnet stands while a corner is drawn, and while a roof is picked for the drags to come. */
function magnetShown(part: FocusParts['magnet'], studio: StudioScreen): boolean {
  if (part === 'shown') return true;
  return part === 'picked' && studio.bar?.kind === 'roofs' && studio.bar.picked !== null;
}

/**
 * The two columns of round tools, standing on the foot (the studio tools board, round 4). Left,
 * what changes the model, the pencil always in the bottom place: the magnet while a corner is drawn
 * or a roof is picked, Roofs with their count once a roof stands (`StudioRoofsButton`), Redo, the
 * trash that clears every corner of the drawing, Undo, then the pencil (×, while drawing). Right,
 * how the model is seen: the sun (3D only), View (`StudioViewPanel`), LiDAR (`T-M05-002g`), the 2D and 3D
 * switch once a roof stands, and Zoom in over Zoom out in one pill. A tool comes only once it can act and takes no place before; a tool
 * coming moves only the ones above it. Undo and Redo keep the place they took (`undoSlotsOf`), dim
 * while they cannot act.
 */
export function StudioToolRail({
  studio,
  view,
  views,
  units,
  editable,
  canUndo,
  canRedo,
  newView,
  parts,
  canWipe,
  foot,
  words,
  onView,
  onUnits,
  onUndo,
  onRedo,
  onWipe,
  onZoomIn,
  onZoomOut,
}: {
  /** The studio, for the pencil and what it opens. */
  studio: StudioScreen;
  view: StudioView;
  views: readonly ViewPlace[];
  units: MeasurementSystem;
  editable: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** The 3D view just opened for the first roof: its circle carries a small dot until seen. */
  newView: boolean;
  /** Which parts show for the job in hand (focus mode). */
  parts: FocusParts;
  /** Two corners or more are drawn: the trash can clear them, which one Undo would not. */
  canWipe: boolean;
  /** On a phone, the canvas's foot, where the View panel opens; `null` on a wide screen. */
  foot: HTMLElement | null;
  /** The trash while drawing: every corner goes, and drawing goes on. */
  onWipe: () => void;
  words: StudioCanvasWords;
  onView: (view: StudioView) => void;
  onUnits: (units: MeasurementSystem) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const pencil = useRef<HTMLSpanElement>(null);
  const opener = useRef<HTMLSpanElement>(null);
  const { viewOpen, moves } = studio;
  return (
    <>
      <div className="hg-studio-tools" data-side="left">
        <Shown when={editable && magnetShown(parts.magnet, studio)} focusTo={pencil}>
          <MagnetSwitch studio={studio} words={words} />
        </Shown>
        <Shown when={studio.roofList.count > 0 && parts.roofs === 'shown'} focusTo={pencil}>
          <StudioRoofsButton studio={studio} words={words} />
        </Shown>
        <Shown when={editable && parts.redo === 'shown'} off={!canRedo} focusTo={pencil}>
          <IconButton label={words.redo} disabled={!canRedo} onClick={onRedo}>
            <ShellGlyph name="redo" size="md" />
          </IconButton>
        </Shown>
        <Shown when={editable && parts.wipe === 'shown' && canWipe} focusTo={pencil}>
          <IconButton label={words.wipeCorners} onClick={onWipe}>
            <ShellGlyph name="trash" size="md" />
          </IconButton>
        </Shown>
        <Shown when={editable && parts.undo === 'shown'} off={!canUndo} focusTo={pencil}>
          <IconButton label={words.undo} disabled={!canUndo} onClick={onUndo}>
            <ShellGlyph name="undo" size="md" />
          </IconButton>
        </Shown>
        <Shown when={parts.pencil !== 'hidden'}>
          <span ref={pencil} className="hg-studio-pencil">
            <StudioPencil studio={studio} words={words} />
          </span>
        </Shown>
      </div>
      <div className="hg-studio-tools" data-side="right">
        {/* The sun and its shade live in 3D only (`FocusParts.sun`): the top view never shows them. */}
        <Shown when={view !== 'top' && studio.roofList.count > 0 && parts.sun === 'shown'}>
          <IconButton
            label={words.sun}
            pressed={studio.sunBar.view !== null}
            onClick={() => (studio.sunBar.view === null ? moves.openSun() : moves.closeSun())}
          >
            <ShellGlyph name="sun" size="md" />
          </IconButton>
        </Shown>
        <Shown when={parts.layers === 'shown' || parts.layers === 'menu'}>
          <span ref={opener} className="hg-studio-view-opener">
            <IconButton
              label={words.view}
              pressed={viewOpen}
              onClick={() => moves.showView(!viewOpen)}
            >
              <ShellGlyph name="sliders" size="md" />
            </IconButton>
            <StudioViewPanel
              open={viewOpen}
              view={view}
              views={views}
              units={units}
              words={words}
              opener={opener}
              foot={foot}
              onView={onView}
              onUnits={onUnits}
              onClose={() => moves.showView(false)}
            />
          </span>
        </Shown>
        <Shown when={parts.lidar === 'shown'}>
          <LidarButton studio={studio} words={words} />
        </Shown>
        <Shown when={parts.layers === 'shown' || parts.layers === 'switch'}>
          <span className="hg-studio-tool-new" data-new={newView}>
            <IconButton
              label={view === 'top' ? words.threeDView : words.topView}
              onClick={() => onView(view === 'top' ? '3d' : 'top')}
            >
              <ShellGlyph name={view === 'top' ? 'box' : 'grid'} size="md" />
            </IconButton>
          </span>
        </Shown>
        <Shown when={parts.zoom === 'shown'}>
          <span className="hg-studio-glass hg-studio-zoom-pill">
            <IconButton label={words.zoomIn} variant="ghost" onClick={onZoomIn}>
              <ShellGlyph name="plus" size="md" />
            </IconButton>
            <IconButton label={words.zoomOut} variant="ghost" onClick={onZoomOut}>
              <ShellGlyph name="minus" size="md" />
            </IconButton>
          </span>
        </Shown>
      </div>
    </>
  );
}
