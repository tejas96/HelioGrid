import type { TranslatedText } from '@heliogrid/contracts';
import { Pressable } from '../../primitives/Pressable';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyph } from '../AppShell/ShellGlyph';
import { zoomStepsOf } from './MapSurface.logic';
import type { MapControlsProps } from './MapSurface.types';

interface CtrlProps {
  label: TranslatedText;
  onPress: () => void;
  glyph: ShellGlyphName;
  disabled?: boolean;
}

function Ctrl({ label, onPress, glyph, disabled = false }: CtrlProps) {
  return (
    <Pressable
      className="hg-map-surface-ctrl"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
    >
      <ShellGlyph name={glyph} size="md" tone="current" />
    </Pressable>
  );
}

/**
 * The 44px controls. The level is legible on the surface — "Zoom 20" is a fact a surveyor
 * checks, not chrome — and re-centre hands the current level back rather than changing it.
 */
export function MapControls({
  zoom,
  minZoom,
  maxZoom,
  showZoomLevel,
  onStepZoom,
  onRecenter,
  words,
}: MapControlsProps) {
  return (
    <div className="hg-map-surface-controls">
      <div className="hg-map-surface-ctrl-group">
        {zoomStepsOf(zoom, minZoom, maxZoom, words).map((step) => (
          <Ctrl
            key={step.glyph}
            label={step.label}
            onPress={() => onStepZoom(step.delta)}
            disabled={step.disabled}
            glyph={step.glyph}
          />
        ))}
      </div>
      {showZoomLevel && zoom !== undefined ? (
        <span className="hg-map-surface-zoom-level">{words.zoomLevel(zoom)}</span>
      ) : null}
      {onRecenter === undefined ? null : (
        <div className="hg-map-surface-ctrl-group">
          <Ctrl label={words.recentre} onPress={() => onRecenter({ zoom })} glyph="recentre" />
        </div>
      )}
    </div>
  );
}
