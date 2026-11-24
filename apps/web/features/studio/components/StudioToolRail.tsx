'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, StudioView, ViewPlace } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, Menu, ShellGlyph } from '@heliogrid/ui';
import { MagnetSwitch } from './StudioBarPills';
import { StudioPencil } from './StudioPencil';
import { Shown } from './StudioShown';

/** The magnet stands while a corner is drawn, and while a roof is picked for the drags to come. */
function magnetShown(part: FocusParts['magnet'], studio: StudioScreen): boolean {
  if (part === 'shown') return true;
  return part === 'picked' && studio.bar?.kind === 'roofs' && studio.bar.picked !== null;
}

/**
 * The two small columns of round tools. Left: what changes the model — the pencil, the one door
 * to the roofs (`StudioPencil`) under the magnet while a corner is drawn or a roof is picked, the trash that clears every corner of the drawing, Undo and Redo
 * (Undo alone while drawing). Right: how the model is seen — the view menu (the
 * views on offer, metres or feet), the 2D and 3D switch, Zoom in, Zoom out and Back to the pin. A
 * view that waits for a roof says why on a tap. The road view and the sun join with their parts.
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
  words,
  onView,
  onUnits,
  onUndo,
  onRedo,
  onWipe,
  onZoomIn,
  onZoomOut,
  onHome,
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
  /** The trash while drawing: every corner goes, and drawing goes on. */
  onWipe: () => void;
  words: StudioCanvasWords;
  onView: (view: StudioView) => void;
  onUnits: (units: MeasurementSystem) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Back to the pin: the view as it opens. */
  onHome: () => void;
}) {
  const sideName: Record<StudioView, TranslatedText> = {
    top: words.topView,
    '3d': words.threeDView,
    north: words.fromNorth,
    east: words.fromEast,
    south: words.fromSouth,
    west: words.fromWest,
  };
  const threeD = views.find((place) => place.view === '3d');
  return (
    <>
      <div className="hg-studio-tools" data-side="left">
        {/* The magnet comes and goes at the column's top: on a phone, where the column stands on
            the foot, the tools under it never move, and no gap is kept for it. */}
        {editable && magnetShown(parts.magnet, studio) ? (
          <MagnetSwitch studio={studio} words={words} />
        ) : null}
        <Shown when={parts.pencil !== 'hidden'}>
          <StudioPencil studio={studio} words={words} />
        </Shown>
        {/* The trash shows only while drawing. */}
        {editable && parts.wipe === 'shown' ? (
          <Shown when={canWipe}>
            <IconButton label={words.wipeCorners} onClick={onWipe}>
              <ShellGlyph name="trash" size="md" />
            </IconButton>
          </Shown>
        ) : null}
        {editable ? (
          <Shown when={parts.undoRedo !== 'hidden'}>
            <IconButton label={words.undo} disabled={!canUndo} onClick={onUndo}>
              <ShellGlyph name="undo" size="md" />
            </IconButton>
          </Shown>
        ) : null}
        {editable ? (
          <Shown when={parts.undoRedo === 'shown'}>
            <IconButton label={words.redo} disabled={!canRedo} onClick={onRedo}>
              <ShellGlyph name="redo" size="md" />
            </IconButton>
          </Shown>
        ) : null}
      </div>
      <div className="hg-studio-tools" data-side="right">
        <Shown when={parts.layers === 'shown'}>
          <Menu
            label={words.view}
            selection="single"
            align="end"
            trigger={
              <IconButton label={words.view}>
                <ShellGlyph name="layers" size="md" />
              </IconButton>
            }
            items={[
              ...views.map((place) => ({
                key: place.view,
                label: sideName[place.view],
                selected: view === place.view,
                ...(place.lock === null
                  ? { onSelect: () => onView(place.view) }
                  : { disabled: true, disabledReason: words.stepLock(place.lock) }),
              })),
              { separator: true },
              {
                key: 'metric',
                label: words.metres,
                meta: words.unitMetres,
                selected: units === 'metric',
                onSelect: () => onUnits('metric'),
              },
              {
                key: 'imperial',
                label: words.feet,
                meta: words.unitFeet,
                selected: units === 'imperial',
                onSelect: () => onUnits('imperial'),
              },
            ]}
          />
        </Shown>
        <Shown when={parts.layers !== 'hidden'}>
          <span className="hg-studio-tool-new" data-new={newView}>
            <IconButton
              label={view === 'top' ? words.threeDView : words.topView}
              {...(view === 'top' && threeD?.lock != null
                ? { disabled: true, disabledReason: words.stepLock(threeD.lock) }
                : { onClick: () => onView(view === 'top' ? '3d' : 'top') })}
            >
              <ShellGlyph name={view === 'top' ? 'box' : 'grid'} size="md" />
            </IconButton>
          </span>
        </Shown>
        {/* The 3D tool: the camera glides to each side of the model. */}
        <Shown when={parts.sideViews === 'shown'}>
          <Menu
            label={words.sideViews}
            selection="single"
            align="end"
            trigger={
              <IconButton label={words.sideViews}>
                <ShellGlyph name="eye" size="md" />
              </IconButton>
            }
            items={views
              .filter((place) => place.view !== 'top')
              .map((place) => ({
                key: place.view,
                label: sideName[place.view],
                selected: view === place.view,
                ...(place.lock === null
                  ? { onSelect: () => onView(place.view) }
                  : { disabled: true, disabledReason: words.stepLock(place.lock) }),
              }))}
          />
        </Shown>
        <Shown when={parts.zoom === 'shown'}>
          <span className="hg-studio-zoom">
            <IconButton label={words.zoomIn} onClick={onZoomIn}>
              <ShellGlyph name="plus" size="md" />
            </IconButton>
            <IconButton label={words.zoomOut} onClick={onZoomOut}>
              <ShellGlyph name="minus" size="md" />
            </IconButton>
          </span>
          <IconButton label={words.backToPin} onClick={onHome}>
            <ShellGlyph name="recentre" size="md" />
          </IconButton>
        </Shown>
      </div>
    </>
  );
}
