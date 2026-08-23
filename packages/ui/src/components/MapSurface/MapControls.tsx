import type { ReactNode } from 'react';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';

interface CtrlProps {
  label: string;
  onPress: () => void;
  /** The glyph path. */
  d: string;
  extra?: ReactNode;
  disabled?: boolean;
}

function Ctrl({ label, onPress, d, extra, disabled = false }: CtrlProps) {
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
          <path d={d} />
          {extra}
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
          d="M12 5v14M5 12h14"
        />
        <Ctrl
          label={zoom === undefined ? 'Zoom out' : `Zoom out — level ${zoom}`}
          onPress={() => onStepZoom(-1)}
          disabled={zoom !== undefined && zoom <= minZoom}
          d="M5 12h14"
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
            d="M12 3v3M12 18v3M3 12h3M18 12h3"
            extra={<circle cx="12" cy="12" r="4" />}
          />
        </div>
      )}
    </div>
  );
}
