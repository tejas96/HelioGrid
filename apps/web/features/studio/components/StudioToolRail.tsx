'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { MeasurementSystem, StudioView, ViewPlace } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { IconButton, Menu, ShellGlyph } from '@heliogrid/ui';

/** The circle size of the studio's tools: small, so they never cover the map. */
const TOOL = theme.layout['button-h-md'];

/**
 * The two small columns of round tools. Left: what changes the model — draw (coming soon), Undo
 * and Redo. Right: how the model is seen — the view menu (the views on offer, metres or feet), the
 * 2D and 3D switch, Zoom in, Zoom out and Back to the pin, and the road view and the sun, coming
 * soon. A view that waits for a roof says why on a tap.
 */
export function StudioToolRail({
  view,
  views,
  units,
  editable,
  canUndo,
  canRedo,
  words,
  onView,
  onUnits,
  onUndo,
  onRedo,
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
          <IconButton
            label={words.drawMyself}
            disabled
            disabledReason={words.drawComing}
            size={TOOL}
          >
            <ShellGlyph name="pencil" size="md" />
          </IconButton>
        ) : null}
        {editable ? (
          <IconButton label={words.undo} disabled={!canUndo} onClick={onUndo} size={TOOL}>
            <ShellGlyph name="undo" size="md" />
          </IconButton>
        ) : null}
        {editable ? (
          <IconButton label={words.redo} disabled={!canRedo} onClick={onRedo} size={TOOL}>
            <ShellGlyph name="redo" size="md" />
          </IconButton>
        ) : null}
      </div>
      <div className="hg-studio-tools" data-side="right">
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
        <IconButton
          label={view === 'top' ? words.threeDView : words.topView}
          size={TOOL}
          {...(view === 'top' && threeD?.lock != null
            ? { disabled: true, disabledReason: words.stepLock(threeD.lock) }
            : { onClick: () => onView(view === 'top' ? '3d' : 'top') })}
        >
          <ShellGlyph name={view === 'top' ? 'box' : 'grid'} size="md" />
        </IconButton>
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
        <IconButton label={words.roadView} disabled disabledReason={words.roadComing} size={TOOL}>
          <ShellGlyph name="camera" size="md" />
        </IconButton>
        <IconButton label={words.sun} disabled disabledReason={words.sunComing} size={TOOL}>
          <ShellGlyph name="sun" size="md" />
        </IconButton>
      </div>
    </>
  );
}
