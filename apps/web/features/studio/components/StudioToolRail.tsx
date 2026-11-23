'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusParts, MeasurementSystem, StudioView, ViewPlace } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { IconButton, Menu, ShellGlyph } from '@heliogrid/ui';
import { Shown } from './StudioShown';

/** The circle size of the studio's tools: small, so they never cover the map. */
const TOOL = theme.layout['button-h-md'];

/**
 * The two small columns of round tools. Left: what changes the model — the pencil that draws a
 * roof, the first or another (filled while drawing: a tap stops), the trash that clears every
 * corner of the drawing,
 * Undo and Redo (Undo alone while drawing). Right: how the model is seen — the view menu (the
 * views on offer, metres or feet), the 2D and 3D switch, Zoom in, Zoom out and Back to the pin. A
 * view that waits for a roof says why on a tap. The road view and the sun join with their parts.
 */
export function StudioToolRail({
  view,
  views,
  units,
  editable,
  canUndo,
  canRedo,
  drawing,
  newView,
  parts,
  canWipe,
  words,
  onView,
  onUnits,
  onUndo,
  onRedo,
  onDraw,
  onWipe,
  onZoomIn,
  onZoomOut,
  onHome,
}: {
  view: StudioView;
  views: readonly ViewPlace[];
  units: MeasurementSystem;
  editable: boolean;
  canUndo: boolean;
  canRedo: boolean;
  /** A roof is being drawn: the pencil is pressed. */
  drawing: boolean;
  /** The 3D view just opened for the first roof: its circle carries a small dot until seen. */
  newView: boolean;
  /** The pencil: draw a roof. */
  onDraw: () => void;
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
        {editable ? (
          <Shown when={parts.pencil !== 'hidden'}>
            <IconButton
              label={drawing ? words.stopDrawing : words.drawRoof}
              size={TOOL}
              variant={drawing ? 'dark' : 'surface'}
              pressed={drawing}
              onClick={onDraw}
            >
              <ShellGlyph name="pencil" size="md" />
            </IconButton>
          </Shown>
        ) : null}
        {/* The trash shows only while drawing: no + for another roof, which is the pencil's job. */}
        {editable && parts.wipe === 'shown' ? (
          <Shown when={canWipe}>
            <IconButton label={words.wipeCorners} size={TOOL} onClick={onWipe}>
              <ShellGlyph name="trash" size="md" />
            </IconButton>
          </Shown>
        ) : null}
        {editable ? (
          <Shown when={parts.undoRedo !== 'hidden'}>
            <IconButton label={words.undo} disabled={!canUndo} onClick={onUndo} size={TOOL}>
              <ShellGlyph name="undo" size="md" />
            </IconButton>
          </Shown>
        ) : null}
        {editable ? (
          <Shown when={parts.undoRedo === 'shown'}>
            <IconButton label={words.redo} disabled={!canRedo} onClick={onRedo} size={TOOL}>
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
              <IconButton label={words.view} size={TOOL}>
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
              size={TOOL}
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
              <IconButton label={words.sideViews} size={TOOL}>
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
            <IconButton label={words.zoomIn} size={TOOL} onClick={onZoomIn}>
              <ShellGlyph name="plus" size="md" />
            </IconButton>
            <IconButton label={words.zoomOut} size={TOOL} onClick={onZoomOut}>
              <ShellGlyph name="minus" size="md" />
            </IconButton>
          </span>
          <IconButton label={words.backToPin} size={TOOL} onClick={onHome}>
            <ShellGlyph name="recentre" size="md" />
          </IconButton>
        </Shown>
      </div>
    </>
  );
}
