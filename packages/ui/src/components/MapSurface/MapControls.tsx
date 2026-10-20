import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';

interface CtrlProps {
  label: string;
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
      <Icon size="md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ShellGlyphMarks name={glyph} />
        </svg>
      </Icon>
    </Pressable>
  );
}

interface MapControlsProps {
  zoom?: number;
  minZoom: number;
  maxZoom: number;
  showZoomLevel: boolean;
  onStepZoom: (delta: number) => void;
  onRecenter?: (info: { zoom?: number }) => void;
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
}: MapControlsProps) {
  return (
    <div className="hg-map-surface-controls">
      <div className="hg-map-surface-ctrl-group">
        <Ctrl
          label={zoom === undefined ? 'Zoom in' : `Zoom in — level ${zoom}`}
          onPress={() => onStepZoom(1)}
          disabled={zoom !== undefined && zoom >= maxZoom}
          glyph="plus"
        />
        <Ctrl
          label={zoom === undefined ? 'Zoom out' : `Zoom out — level ${zoom}`}
          onPress={() => onStepZoom(-1)}
          disabled={zoom !== undefined && zoom <= minZoom}
          glyph="minus"
        />
      </div>
      {showZoomLevel && zoom !== undefined ? (
        <span className="hg-map-surface-zoom-level">Zoom {zoom}</span>
      ) : null}
      {onRecenter === undefined ? null : (
        <div className="hg-map-surface-ctrl-group">
          <Ctrl
            label="Recentre — keeps this zoom"
            onPress={() => onRecenter({ zoom })}
            glyph="recentre"
          />
        </div>
      )}
    </div>
  );
}
