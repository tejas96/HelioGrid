'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import {
  type DrawHelpers,
  type FocusParts,
  type MeasurementSystem,
  STUDIO_HELPERS,
  type StudioHelper,
  type StudioView,
  type ViewPlace,
} from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import {
  Button,
  IconButton,
  Menu,
  Pressable,
  ShellGlyph,
  type ShellGlyphName,
} from '@heliogrid/ui';
import { Shown } from './StudioShown';

/** The circle size of the studio's tools: small, so they never cover the map. */
const TOOL = theme.layout['button-h-md'];

const HELPER_GLYPH: Record<StudioHelper, ShellGlyphName> = {
  square: 'right-angle',
  line_up: 'line-up',
  buildings: 'building',
};

/**
 * The helper bar beside the pencil (`T-M05-002`, part b): Square, Line up and Buildings, each a
 * switch that is on at first. It shows only while a corner is drawn or dragged. With no building
 * data yet, a small note says Buildings snaps to the design's other roofs alone.
 */
function HelperBar({
  helpers,
  buildingData,
  refused,
  words,
  onHelper,
  onRetry,
}: {
  helpers: DrawHelpers;
  buildingData: boolean;
  /** The last save of the picks was refused: said here, where the pick was made. */
  refused: boolean;
  words: StudioCanvasWords;
  onHelper: (helper: StudioHelper) => void;
  onRetry: () => void;
}) {
  return (
    <fieldset className="hg-studio-glass hg-studio-helpers" aria-label={words.helpers}>
      {STUDIO_HELPERS.map((helper) => (
        <Pressable
          key={helper}
          className="hg-studio-helper"
          accessibilityRole="switch"
          accessibilityState={{ checked: helpers[helper] }}
          accessibilityLabel={words.helper[helper]}
          onPress={() => onHelper(helper)}
        >
          <ShellGlyph name={HELPER_GLYPH[helper]} size="sm" />
          <span>{words.helper[helper]}</span>
        </Pressable>
      ))}
      {helpers.buildings && !buildingData ? (
        <span className="hg-studio-helper-note">{words.noBuildingData}</span>
      ) : null}
      {refused ? (
        <span className="hg-studio-helper-refused" role="alert">
          {words.helpersNotSaved}
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {words.tryAgain}
          </Button>
        </span>
      ) : null}
    </fieldset>
  );
}

/**
 * The two small columns of round tools. Left: what changes the model — the pencil that draws a
 * roof (pressed while drawing), Undo and Redo. Right: how the model is seen — the view menu (the
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
  helpers,
  buildingData,
  helpersRefused,
  hasRoof,
  words,
  onView,
  onUnits,
  onUndo,
  onRedo,
  onDraw,
  onHelper,
  onRetryHelpers,
  onAddRoof,
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
  helpers: DrawHelpers;
  buildingData: boolean;
  helpersRefused: boolean;
  onHelper: (helper: StudioHelper) => void;
  onRetryHelpers: () => void;
  /** A roof stands: the + that starts another is there (focus mode may set it aside). */
  hasRoof: boolean;
  /** The + that starts another roof. */
  onAddRoof: () => void;
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
          // The helper bar keeps the pencil's place when the pencil steps aside: a corner dragged
          // after the close has its helpers, and no pencil.
          <span className="hg-studio-pencil">
            <Shown when={parts.pencil !== 'hidden'}>
              <IconButton
                label={words.drawRoof}
                size={TOOL}
                variant={drawing ? 'dark' : 'surface'}
                pressed={drawing}
                onClick={onDraw}
              >
                <ShellGlyph name="pencil" size="md" />
              </IconButton>
            </Shown>
            <Shown when={parts.helperBar === 'shown'}>
              <HelperBar
                helpers={helpers}
                buildingData={buildingData}
                refused={helpersRefused}
                words={words}
                onHelper={onHelper}
                onRetry={onRetryHelpers}
              />
            </Shown>
          </span>
        ) : null}
        {editable && hasRoof ? (
          <Shown when={parts.addRoof === 'shown'}>
            <IconButton label={words.addRoof} size={TOOL} onClick={onAddRoof}>
              <ShellGlyph name="plus" size="md" />
            </IconButton>
          </Shown>
        ) : null}
        {editable ? (
          <Shown when={parts.undoRedo === 'shown'}>
            <IconButton label={words.undo} disabled={!canUndo} onClick={onUndo} size={TOOL}>
              <ShellGlyph name="undo" size="md" />
            </IconButton>
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
                meta: 'm',
                selected: units === 'metric',
                onSelect: () => onUnits('metric'),
              },
              {
                key: 'imperial',
                label: words.feet,
                meta: 'ft',
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
